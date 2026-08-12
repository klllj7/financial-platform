const {
  BedrockClient,
  ListFoundationModelsCommand,
} = require("@aws-sdk/client-bedrock");

const client = new BedrockClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

const CACHE_TTL_MS = 1000 * 60 * 60; // 모델 목록은 자주 바뀌지 않아 1시간 캐시한다.
let cache = { data: null, expiresAt: 0 };

/*
  Bedrock 서버리스(온디맨드) 파운데이션 모델만 신청 가능한 카탈로그로 제공한다.
  Marketplace/프로비저닝 엔드포인트 모델은 신청 즉시 사용 불가(별도 배포 필요)라 제외한다.
*/
const listAvailableBedrockModels = async () => {
  if (cache.data && Date.now() < cache.expiresAt) return cache.data;

  const { modelSummaries } = await client.send(
    new ListFoundationModelsCommand({ byOutputModality: "TEXT" }),
  );

  const models = (modelSummaries || [])
    .filter(
      (model) =>
        model.modelLifecycle?.status === "ACTIVE" &&
        model.inferenceTypesSupported?.includes("ON_DEMAND"),
    )
    .map((model) => ({
      modelId: model.modelId,
      modelName: model.modelName,
      providerName: model.providerName,
    }))
    .sort((a, b) => a.providerName.localeCompare(b.providerName) || a.modelName.localeCompare(b.modelName));

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
