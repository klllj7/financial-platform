const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const { getAdapter } = require("./bedrock-adapters");

const providerError = (code, message, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

/* 임직원이 신청·승인받은 임의의 Bedrock 서버리스 모델을 호출한다. */
const invokeBedrockModel = async ({ modelId, messages, maxTokens }) => {
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

  return {
    content,
    modelName: modelId.split("/").pop(),
    inputTokens,
    outputTokens,
  };
};

/* 기본 제공 AI(Solar 슬롯)를 Bedrock으로 전환했을 때 쓰는 고정 모델 호출 경로다. */
const createBedrockMessage = (messages) =>
  invokeBedrockModel({ modelId: process.env.BEDROCK_MODEL_ID, messages });

module.exports = {
  createBedrockMessage,
  invokeBedrockModel,
};
