const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const { getAdapter } = require("./bedrock-adapters");
const { getDisplayName, ALLOWED_MODELS } = require("./allowed-models.config");

const providerError = (code, message, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

/* 임직원이 신청·승인받은 임의의 Bedrock 서버리스 모델을 호출한다. */
const invokeBedrockModel = async ({ modelId, messages, maxTokens }) => {
  // TODO(디버그용, 원인 확인되면 제거): 기본 슬롯이 라벨과 다른 모델을 호출하는
  // 문제 추적 중. 실제로 어떤 modelId가 들어오는지, 화이트리스트 조회 결과가
  // 뭔지 CloudWatch Logs로 확인하기 위한 임시 로그.
  console.log("[bedrock-debug] invokeBedrockModel called", {
    modelId,
    getDisplayNameResult: getDisplayName(modelId),
    envBedrockModelId: process.env.BEDROCK_MODEL_ID,
    envRestrictToDemoModels: process.env.RESTRICT_TO_DEMO_MODELS,
    envAiProvider: process.env.AI_PROVIDER,
    allowedModelIds: ALLOWED_MODELS.map((m) => m.modelId),
  });

  if (!modelId) {
    throw providerError(
      "BEDROCK_MODEL_ID_REQUIRED",
      "Bedrock 모델 ID가 설정되지 않았습니다.",
      503,
    );
  }

  const adapter = getAdapter(modelId);
  const resolvedMaxTokens = maxTokens || Number(process.env.BEDROCK_MAX_TOKENS) || 2048;

  let response;
  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(adapter.buildBody(messages, resolvedMaxTokens)),
    });
    response = await client.send(command);
  } catch (error) {
    // 일부 모델은 IAM 권한과 별개로 AWS Marketplace 구독이 있어야 호출된다.
    // 이 경우 AccessDeniedException 메시지에 aws-marketplace:Subscribe가 포함된다.
    if (typeof error.message === "string" && error.message.includes("aws-marketplace:Subscribe")) {
      throw providerError(
        "BEDROCK_MARKETPLACE_SUBSCRIPTION_REQUIRED",
        "이 모델은 AWS Marketplace 구독이 필요합니다. 관리자에게 문의해주세요.",
        403,
      );
    }
    throw providerError(
      "BEDROCK_CONNECTION_FAILED",
      error.name === "TimeoutError"
        ? "Bedrock 응답 시간이 초과되었습니다."
        : `Bedrock 호출에 실패했습니다: ${error.message}`,
      502,
    );
  }

  const raw = JSON.parse(new TextDecoder().decode(response.body));
  const { content, inputTokens, outputTokens } = adapter.parseResponse(raw);

  if (!content) {
    throw providerError(
      "BEDROCK_EMPTY_RESPONSE",
      "Bedrock에서 답변을 받지 못했습니다.",
      502,
    );
  }

  // 채팅 화면에는 원본 모델ID/ARN 대신 사람이 읽을 수 있는 이름을 보여준다.
  // 화이트리스트에 없는 모델(범위를 넓혔을 때)은 원본 ID로 대체 표시한다.
  return {
    content,
    modelName: getDisplayName(modelId) || modelId.split("/").pop(),
    inputTokens,
    outputTokens,
  };
};

/*
  기본 제공 AI(Solar 슬롯)를 Bedrock으로 전환했을 때 쓰는 고정 모델 호출 경로다.
  RESTRICT_TO_DEMO_MODELS=true일 때는 BEDROCK_MODEL_ID 값이 뭐든(비어있거나
  잘못된 값이어도) 무시하고 allowed-models.config.js의 첫 번째 모델을 쓴다 —
  시연 중 이 슬롯이 검증 안 된 모델을 부르는 사고를 코드 레벨에서 막기 위함.
  시연이 끝나면(플래그 false) 다시 BEDROCK_MODEL_ID 환경변수를 따른다.
*/
const resolveDefaultModelId = () =>
  process.env.RESTRICT_TO_DEMO_MODELS === "true"
    ? ALLOWED_MODELS[0]?.modelId
    : process.env.BEDROCK_MODEL_ID;

const createBedrockMessage = (messages) =>
  invokeBedrockModel({ modelId: resolveDefaultModelId(), messages });

module.exports = {
  createBedrockMessage,
  invokeBedrockModel,
};
