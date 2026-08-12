const {
  BedrockClient,
  ListFoundationModelsCommand,
  ListInferenceProfilesCommand,
} = require("@aws-sdk/client-bedrock");
const { isVendorSupported } = require("../chat/bedrock-adapters");

const client = new BedrockClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

const CACHE_TTL_MS = 1000 * 60 * 60; // 모델 목록은 자주 바뀌지 않아 1시간 캐시한다.
let cache = { data: null, expiresAt: 0 };

/* 온디맨드로 바로 호출 가능한 파운데이션 모델만 대상으로 한다. */
const listOnDemandModels = async () => {
  const { modelSummaries } = await client.send(
    new ListFoundationModelsCommand({ byOutputModality: "TEXT" }),
  );

  return (modelSummaries || [])
    .filter(
      (model) =>
        model.modelLifecycle?.status === "ACTIVE" &&
        model.inputModalities?.includes("TEXT") &&
        model.outputModalities?.includes("TEXT") &&
        model.inferenceTypesSupported?.includes("ON_DEMAND") &&
        isVendorSupported(model.modelId),
    )
    .map((model) => ({
      modelId: model.modelId,
      modelName: model.modelName,
      providerName: model.providerName,
    }));
};

/*
  Claude Haiku 4.5처럼 리전 온디맨드가 아예 지원되지 않고 크로스 리전
  추론 프로파일로만 호출 가능한 모델은 ListFoundationModels에 잡히지 않는다.
  이 목록을 더해야 신청 가능한 모델이 실제로 늘어난다.
*/
const listInferenceProfileModels = async () => {
  const { inferenceProfileSummaries } = await client.send(
    new ListInferenceProfilesCommand({}),
  );

  return (inferenceProfileSummaries || [])
    .filter(
      (profile) =>
        profile.status === "ACTIVE" &&
        isVendorSupported(profile.inferenceProfileId),
    )
    .map((profile) => {
      const vendor = profile.inferenceProfileId.split(".").find((segment) =>
        ["anthropic", "amazon", "meta", "mistral", "cohere"].includes(segment),
      );
      return {
        modelId: profile.inferenceProfileId,
        modelName: `${profile.inferenceProfileName} (추론 프로파일)`,
        providerName: vendor
          ? vendor.charAt(0).toUpperCase() + vendor.slice(1)
          : "기타",
      };
    });
};

/*
  Bedrock 서버리스로 신청 즉시 호출 가능한 모델만 카탈로그로 제공한다.
  Marketplace/프로비저닝 엔드포인트 모델은 별도 배포가 필요해 제외한다.
*/
const listAvailableBedrockModels = async () => {
  if (cache.data && Date.now() < cache.expiresAt) return cache.data;

  const [onDemandModels, inferenceProfileModels] = await Promise.all([
    listOnDemandModels(),
    listInferenceProfileModels(),
  ]);

  const models = [...onDemandModels, ...inferenceProfileModels].sort(
    (a, b) =>
      a.providerName.localeCompare(b.providerName) ||
      a.modelName.localeCompare(b.modelName),
  );

  cache = { data: models, expiresAt: Date.now() + CACHE_TTL_MS };
  return models;
};

/* 캐시된 목록 기준으로 modelId가 실제 신청 가능한 서버리스 모델인지 검증한다. */
const isModelAvailable = async (modelId) => {
  const models = await listAvailableBedrockModels();
  return models.some((model) => model.modelId === modelId);
};

module.exports = {
  listAvailableBedrockModels,
  isModelAvailable,
};
