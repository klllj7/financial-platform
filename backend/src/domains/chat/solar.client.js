const DEFAULT_BASE_URL = "https://api.upstage.ai/v1";
const DEFAULT_MODEL = "solar-pro3";

const providerError = (code, message, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

/* Solar API 키는 백엔드 환경변수에서만 읽고 프런트엔드로 전달하지 않는다. */
const createSolarMessage = async (messages) => {
  const apiKey = process.env.UPSTAGE_API_KEY;

  if (!apiKey) {
    throw providerError(
      "SOLAR_API_KEY_REQUIRED",
      "Upstage API Key가 설정되지 않았습니다.",
      503,
    );
  }

  const baseUrl = (process.env.UPSTAGE_BASE_URL || DEFAULT_BASE_URL)
    .replace(/\/$/, "");
  const model = process.env.UPSTAGE_MODEL || DEFAULT_MODEL;
  const maxTokens = Number(process.env.UPSTAGE_MAX_TOKENS) || 2048;

  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
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
      "SOLAR_CONNECTION_FAILED",
      error.name === "TimeoutError"
        ? "Solar 응답 시간이 초과되었습니다."
        : "Solar API에 연결하지 못했습니다.",
      502,
    );
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw providerError(
      "SOLAR_API_FAILED",
      result.error?.message || "Solar API 호출에 실패했습니다.",
      502,
    );
  }

  const content = result.choices?.[0]?.message?.content || "";
  if (!content) {
    throw providerError(
      "SOLAR_EMPTY_RESPONSE",
      "Solar에서 답변을 받지 못했습니다.",
      502,
    );
  }

  return {
    content,
    modelName: result.model || model,
    inputTokens: result.usage?.prompt_tokens || 0,
    outputTokens: result.usage?.completion_tokens || 0,
  };
};

module.exports = {
  createSolarMessage,
};
