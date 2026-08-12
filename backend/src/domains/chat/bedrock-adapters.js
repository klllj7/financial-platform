/*
  Bedrock 서버리스 모델은 공급사별로 InvokeModel 요청/응답 스키마가 다르다.
  modelId 접두사로 알맞은 어댑터(build/parse)를 골라준다.
  주의: 아래 스키마는 AWS 공식 문서 기준이며, 공급사가 스펙을 바꿀 수 있으므로
  신규 모델을 카탈로그에 추가하기 전 실제 응답으로 한 번 검증할 것을 권장한다.
*/

const toAnthropicMessages = (messages) =>
  messages.map((message) => ({
    role: message.role === "ASSISTANT" ? "assistant" : "user",
    content: message.content,
  }));

/* Titan/Llama/Mistral/Cohere처럼 단일 프롬프트를 받는 모델용 변환기다. */
const toPlainPrompt = (messages) =>
  messages
    .map((message) =>
      `${message.role === "ASSISTANT" ? "Assistant" : "Human"}: ${message.content}`)
    .join("\n\n") + "\n\nAssistant:";

const anthropicAdapter = {
  buildBody: (messages, maxTokens) => ({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    messages: toAnthropicMessages(messages),
  }),
  parseResponse: (raw) => ({
    content: raw.content?.[0]?.text || "",
    inputTokens: raw.usage?.input_tokens || 0,
    outputTokens: raw.usage?.output_tokens || 0,
  }),
};

const titanAdapter = {
  buildBody: (messages, maxTokens) => ({
    inputText: toPlainPrompt(messages),
    textGenerationConfig: {
      maxTokenCount: maxTokens,
      temperature: 0.7,
      topP: 0.9,
    },
  }),
  parseResponse: (raw) => ({
    content: raw.results?.[0]?.outputText?.trim() || "",
    inputTokens: raw.inputTextTokenCount || 0,
    outputTokens: raw.results?.[0]?.tokenCount || 0,
  }),
};

const llamaAdapter = {
  buildBody: (messages, maxTokens) => ({
    prompt: toPlainPrompt(messages),
    max_gen_len: maxTokens,
    temperature: 0.7,
    top_p: 0.9,
  }),
  parseResponse: (raw) => ({
    content: raw.generation?.trim() || "",
    inputTokens: raw.prompt_token_count || 0,
    outputTokens: raw.generation_token_count || 0,
  }),
};

const mistralAdapter = {
  buildBody: (messages, maxTokens) => ({
    prompt: toPlainPrompt(messages),
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 0.9,
  }),
  parseResponse: (raw) => ({
    content: raw.outputs?.[0]?.text?.trim() || "",
    // Mistral의 InvokeModel 응답에는 토큰 사용량 필드가 없다.
    inputTokens: 0,
    outputTokens: 0,
  }),
};

const cohereAdapter = {
  buildBody: (messages, maxTokens) => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role !== "ASSISTANT");
    const chatHistory = messages
      .filter((m) => m !== lastUserMessage)
      .map((m) => ({
        role: m.role === "ASSISTANT" ? "CHATBOT" : "USER",
        message: m.content,
      }));
    return {
      message: lastUserMessage?.content || "",
      chat_history: chatHistory,
      max_tokens: maxTokens,
      temperature: 0.7,
    };
  },
  parseResponse: (raw) => ({
    content: raw.text?.trim() || "",
    // Cohere Command의 InvokeModel 응답에는 토큰 사용량 필드가 없다.
    inputTokens: 0,
    outputTokens: 0,
  }),
};

/*
  modelId 형태가 두 가지라 접두사(startsWith)만으로는 못 잡는다.
  - 파운데이션 모델 ID: "anthropic.claude-3-sonnet-..." (벤더가 맨 앞)
  - 추론 프로파일 ID:   "global.anthropic.claude-haiku-4-5-..." (리전/스코프가 맨 앞, 벤더는 중간)
  그래서 문자열 어디에 있든 찾도록 includes로 검사한다.
*/
const ADAPTERS = [
  { match: (id) => id.includes("anthropic."), adapter: anthropicAdapter },
  { match: (id) => id.includes("amazon.titan"), adapter: titanAdapter },
  { match: (id) => id.includes("meta.llama"), adapter: llamaAdapter },
  { match: (id) => id.includes("mistral."), adapter: mistralAdapter },
  { match: (id) => id.includes("cohere."), adapter: cohereAdapter },
];

/* 카탈로그 필터링과 실제 호출이 항상 같은 기준을 쓰도록 이 목록을 공유한다. */
const isVendorSupported = (modelId) => ADAPTERS.some(({ match }) => match(modelId));

const getAdapter = (modelId) => {
  const found = ADAPTERS.find(({ match }) => match(modelId));
  if (!found) {
    throw Object.assign(
      new Error(`지원하지 않는 Bedrock 모델입니다: ${modelId}`),
      { code: "BEDROCK_MODEL_UNSUPPORTED", statusCode: 502 },
    );
  }
  return found.adapter;
};

module.exports = { getAdapter, isVendorSupported };
