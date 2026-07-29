const ChatSession = require("./chat-session.model");
const ChatMessage = require("./chat-message.model");
const AiToolApplication = require("../ai-tools/ai-tool-application.model");
const { createSolarMessage } = require("./solar.client");

const DEFAULT_SOLAR_TOOL_KEY = "DEFAULT_SOLAR";
const DLP_SERVICE_URL = process.env.DLP_SERVICE_URL || "http://localhost:8000";

const serviceError = (code, message, statusCode) => Object.assign(new Error(message), { code, statusCode });

/* 요청한 채팅방이 현재 로그인 사용자의 것인지 확인한다. */
const findOwnedSession = async (userId, sessionId) => {
  const session = await ChatSession.findOne({ where: { id: sessionId, userId } });
  if (!session) throw serviceError("CHAT_SESSION_NOT_FOUND", "채팅을 찾을 수 없습니다.", 404);
  return session;
};

const getSessions = (userId) => ChatSession.findAll({
  where: { userId },
  order: [["isPinned", "DESC"], ["updatedAt", "DESC"]],
});

const getMessages = async ({ userId, sessionId }) => {
  await findOwnedSession(userId, sessionId);
  return ChatMessage.findAll({ where: { sessionId }, order: [["createdAt", "ASC"]] });
};

const updatePin = async ({ userId, sessionId, isPinned }) => {
  const session = await findOwnedSession(userId, sessionId);
  return session.update({ isPinned });
};

/*
  C 담당 DLP 서비스(/gateway/chat)에 프롬프트를 보내 PII 탐지·마스킹·차단 여부를 받아온다.
  탐지된 이벤트는 DLP 쪽 usage_log/event_log/action_history에 자동으로 기록되어
  "위험 이벤트 관리" 화면에 바로 반영된다.
  DLP 서비스가 응답하지 않으면(로컬에서 안 켜져 있는 등) 채팅 자체가 막히지 않도록
  탐지 없이 통과시키고 에러만 로그로 남긴다.
*/
const inspectPrompt = async (message, userId) => {
  try {
    const response = await fetch(`${DLP_SERVICE_URL}/gateway/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message, user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`DLP 서비스 응답 오류 (status: ${response.status})`);
    }

    const data = await response.json();
    return {
      blocked: data.action_status === "blocked",
      maskApplied: data.action_status === "masked",
      safePrompt: data.prompt ?? message,
    };
  } catch (error) {
    console.error("DLP 서비스 호출 실패, 탐지 없이 통과시킵니다:", error.message);
    return { blocked: false, maskApplied: false, safePrompt: message };
  }
};

/* 선택한 AI Tool 신청이 승인 상태이고 현재 사용자가 사용할 수 있는지 확인한다. */
const findApprovedTool = async ({
  aiToolApplicationId,
  toolKey,
}) => {
  if (toolKey === DEFAULT_SOLAR_TOOL_KEY) {
    return {
      toolName: "Solar Pro 3",
      provider: "Upstage",
      isDefaultSolar: true,
    };
  }

  if (!aiToolApplicationId) {
    throw serviceError(
      "CHAT_AI_TOOL_REQUIRED",
      "사용할 AI Tool을 선택해 주세요.",
      400,
    );
  }

  const application = await AiToolApplication.findOne({
    where: {
      id: aiToolApplicationId,
      status: "APPROVED",
      isActive: true,
    },
  });

  if (!application) {
    throw serviceError(
      "CHAT_AI_TOOL_NOT_APPROVED",
      "승인되지 않았거나 사용할 수 없는 AI Tool입니다.",
      403,
    );
  }
  return application;
};

const sendMessage = async ({
  userId,
  sessionId,
  aiToolApplicationId,
  toolKey,
  message,
}) => {
  const approvedTool = await findApprovedTool({
    aiToolApplicationId,
    toolKey,
  });

  const session = sessionId
    ? await findOwnedSession(userId, sessionId)
    : await ChatSession.create({
      userId,
      title: message.length > 30 ? `${message.slice(0, 30)}…` : message,
    });

  const inspection = await inspectPrompt(message, userId);
  const previousMessages = await ChatMessage.findAll({
    where: { sessionId: session.id },
    order: [["createdAt", "ASC"]],
  });
  const userMessage = await ChatMessage.create({
    sessionId: session.id,
    role: "USER",
    // 차단된 경우 원문 대신 저장할 안전한 값이 없으니 원문을 남기고,
    // 마스킹된 경우 DLP가 돌려준 마스킹 결과를 저장/전달한다.
    content: inspection.blocked ? message : inspection.safePrompt,
  });

  let reply;
  let modelName = null;
  let inputTokens = 0;
  let outputTokens = 0;

  if (inspection.blocked) {
    reply = "보안 정책에 의해 요청이 차단되었습니다. 인증정보나 기밀정보를 제거해 주세요.";
  } else if (approvedTool.isDefaultSolar) {
    const solarResponse = await createSolarMessage([
      ...previousMessages,
      userMessage,
    ]);
    reply = solarResponse.content;
    modelName = solarResponse.modelName;
    inputTokens = solarResponse.inputTokens;
    outputTokens = solarResponse.outputTokens;
  } else {
    throw serviceError(
      "CHAT_TOOL_PROVIDER_NOT_CONFIGURED",
      `${approvedTool.toolName} 제공자 API가 아직 연결되지 않았습니다.`,
      503,
    );
  }

  /*
    AI가 생성한 답변 자체에 민감정보가 들어있을 수 있어서(참조 데이터를
    그대로 인용하거나 잘못 생성하는 경우), 입력과 마찬가지로 응답도
    DLP로 한 번 더 검사한다. 입력이 이미 차단된 경우(reply가 안내 문구일
    뿐 실제 AI 응답이 아님)에는 다시 검사할 필요가 없어 건너뛴다.
  */
  let outputInspection = { blocked: false, maskApplied: false };
  if (!inspection.blocked) {
    outputInspection = await inspectPrompt(reply, userId);
    if (outputInspection.blocked) {
      reply = "AI가 생성한 답변에 민감한 내용이 포함되어 있어 표시할 수 없습니다. 다른 방식으로 다시 질문해 주세요.";
    } else if (outputInspection.maskApplied) {
      reply = outputInspection.safePrompt;
    }
  }

  const assistantMessage = await ChatMessage.create({
    sessionId: session.id,
    role: "ASSISTANT",
    content: reply,
    blocked: inspection.blocked || outputInspection.blocked,
    maskApplied: inspection.maskApplied || outputInspection.maskApplied,
    modelName,
    inputTokens,
    outputTokens,
  });

  await session.update({ updatedAt: new Date() }, { silent: false });
  return { session, userMessage, assistantMessage };
};

module.exports = {
  getSessions,
  getMessages,
  updatePin,
  sendMessage,
};
