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

const ADAPTERS = [
  { prefix: "anthropic.", adapter: anthropicAdapter },
  { prefix: "amazon.titan", adapter: titanAdapter },
  { prefix: "meta.llama", adapter: llamaAdapter },
  { prefix: "mistral.", adapter: mistralAdapter },
  { prefix: "cohere.", adapter: cohereAdapter },
];

const getAdapter = (modelId) => {
  const match = ADAPTERS.find(({ prefix }) => modelId.startsWith(prefix));
  if (!match) {
    throw Object.assign(
      new Error(`지원하지 않는 Bedrock 모델입니다: ${modelId}`),
      { code: "BEDROCK_MODEL_UNSUPPORTED", statusCode: 502 },
    );
  }
  return match.adapter;
};

module.exports = { getAdapter };
