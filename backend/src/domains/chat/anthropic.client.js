const DEFAULT_BASE_URL = "https://api.anthropic.com";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const providerError = (code, message, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

/* Claude로 전송하기 전에 대표적인 개인식별정보 패턴을 한 번 더 마스킹한다. */
const maskSensitiveText = (text) =>
  String(text)
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, "[주민등록번호 마스킹]")
    .replace(/\b01[016789]-?\d{3,4}-?\d{4}\b/g, "[전화번호 마스킹]")
    .replace(/\b\d{2,4}-\d{2,6}-\d{2,6}\b/g, "[계좌번호 마스킹]");

/* 연속된 같은 역할 메시지를 합쳐 Anthropic Messages API 형식으로 정리한다. */
const normalizeMessages = (messages) =>
  messages.reduce((result, message) => {
    const role = message.role === "ASSISTANT" ? "assistant" : "user";
    const content = role === "user"
      ? maskSensitiveText(message.content)
      : message.content;
    const previous = result[result.length - 1];

    if (previous?.role === role) {
      previous.content += `\n\n${content}`;
    } else {
      result.push({ role, content });
    }
    return result;
  }, []);

/* Claude API 키는 백엔드 환경변수에서만 읽고 프런트엔드로 전달하지 않는다. */
const createClaudeMessage = async (messages) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw providerError(
      "CLAUDE_API_KEY_REQUIRED",
      "Claude API 키가 설정되지 않았습니다.",
      503,
    );
  }

  const baseUrl = (process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL)
    .replace(/\/$/, "");
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS) || 2048;

  let response;
  try {
    response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system:
          "당신은 금융회사 임직원의 업무를 돕는 AI입니다. 개인정보와 인증정보를 요구하지 말고, 불확실한 내용은 명확히 표시하세요.",
        messages: normalizeMessages(messages),
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    throw providerError(
      "CLAUDE_CONNECTION_FAILED",
      error.name === "TimeoutError"
        ? "Claude 응답 시간이 초과되었습니다."
        : "Claude API에 연결하지 못했습니다.",
      502,
    );
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw providerError(
      "CLAUDE_API_FAILED",
      result.error?.message || "Claude가 요청을 처리하지 못했습니다.",
      502,
    );
  }

  const content = Array.isArray(result.content)
    ? result.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim()
    : "";

  if (!content) {
    throw providerError(
      "CLAUDE_EMPTY_RESPONSE",
      "Claude에서 답변을 받지 못했습니다.",
      502,
    );
  }

  return {
    content,
    modelName: model,
    inputTokens: result.usage?.input_tokens || 0,
    outputTokens: result.usage?.output_tokens || 0,
  };
};

module.exports = { createClaudeMessage };
