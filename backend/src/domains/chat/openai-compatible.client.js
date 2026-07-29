const providerError = (code, message, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

const normalizeBaseUrl = (value) => value.replace(/\/+$/, "");

const callProvider = async ({
  apiKey,
  baseUrl,
  modelId,
  messages,
  maxTokens = 2048,
}) => {
  let response;
  try {
    response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map((message) => ({
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        })),
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    throw providerError(
      "AI_PROVIDER_CONNECTION_FAILED",
      error.name === "TimeoutError"
        ? "AI 공급사 응답 시간이 초과되었습니다."
        : "AI 공급사 API에 연결하지 못했습니다.",
      502,
    );
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw providerError(
      "AI_PROVIDER_API_FAILED",
      result.error?.message || `AI 공급사 API 호출에 실패했습니다. (${response.status})`,
      502,
    );
  }

  const content = result.choices?.[0]?.message?.content || "";
  if (!content) {
    throw providerError(
      "AI_PROVIDER_EMPTY_RESPONSE",
      "AI 공급사에서 답변을 받지 못했습니다.",
      502,
    );
  }

  return {
    content,
    modelName: result.model || modelId,
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
  };
};

const testOpenAiCompatibleConnection = (configuration) =>
  callProvider({
    ...configuration,
    messages: [{ role: "USER", content: "Reply with OK." }],
    maxTokens: 8,
  });

module.exports = {
  createOpenAiCompatibleMessage: callProvider,
  testOpenAiCompatibleConnection,
};
