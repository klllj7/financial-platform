const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const providerError = (code, message, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

const createBedrockMessage = async (messages) => {
  const modelId = process.env.BEDROCK_MODEL_ID;

  if (!modelId) {
    throw providerError(
      "BEDROCK_MODEL_ID_REQUIRED",
      "Bedrock 모델 ID가 설정되지 않았습니다.",
      503,
    );
  }

  const maxTokens = Number(process.env.BEDROCK_MAX_TOKENS) || 2048;

  let response;
  try {
    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        messages: messages.map((message) => ({
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        })),
      }),
    });
    response = await client.send(command);
  } catch (error) {
    throw providerError(
      "BEDROCK_CONNECTION_FAILED",
      error.name === "TimeoutError"
        ? "Bedrock 응답 시간이 초과되었습니다."
        : `Bedrock 호출에 실패했습니다: ${error.message}`,
      502,
    );
  }

  const result = JSON.parse(new TextDecoder().decode(response.body));
  const content = result.content?.[0]?.text || "";

  if (!content) {
    throw providerError(
      "BEDROCK_EMPTY_RESPONSE",
      "Bedrock에서 답변을 받지 못했습니다.",
      502,
    );
  }

  return {
    content,
    modelName: modelId,
    inputTokens: result.usage?.input_tokens || 0,
    outputTokens: result.usage?.output_tokens || 0,
  };
};

module.exports = {
  createBedrockMessage,
};
