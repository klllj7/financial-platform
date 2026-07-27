const ChatSession = require("./chat-session.model");
const ChatMessage = require("./chat-message.model");
const AiToolApplication = require("../ai-tools/ai-tool-application.model");
const { createSolarMessage } = require("./solar.client");

const DEFAULT_SOLAR_TOOL_KEY = "DEFAULT_SOLAR";

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

/* DLP 서비스 연결 전 차단·마스킹 화면을 검증하기 위한 동일한 반환 형식이다. */
const inspectPrompt = (message) => ({
  blocked: /비밀번호|인증번호|기밀|보안키/i.test(message),
  maskApplied: /주민등록번호|계좌번호|전화번호/i.test(message),
});

/* 선택한 AI Tool 신청이 승인 상태이고 현재 사용자가 사용할 수 있는지 확인한다. */
const findApprovedTool = async ({
  userId,
  roleCode,
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
      ...(["COMPLIANCE_MANAGER", "ADMIN"].includes(roleCode)
        ? {}
        : { userId }),
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
  roleCode,
  sessionId,
  aiToolApplicationId,
  toolKey,
  message,
}) => {
  const approvedTool = await findApprovedTool({
    userId,
    roleCode,
    aiToolApplicationId,
    toolKey,
  });

  const session = sessionId
    ? await findOwnedSession(userId, sessionId)
    : await ChatSession.create({
      userId,
      title: message.length > 30 ? `${message.slice(0, 30)}…` : message,
    });

  const inspection = inspectPrompt(message);
  const previousMessages = await ChatMessage.findAll({
    where: { sessionId: session.id },
    order: [["createdAt", "ASC"]],
  });
  const userMessage = await ChatMessage.create({
    sessionId: session.id,
    role: "USER",
    content: message,
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

  const assistantMessage = await ChatMessage.create({
    sessionId: session.id,
    role: "ASSISTANT",
    content: reply,
    blocked: inspection.blocked,
    maskApplied: inspection.maskApplied,
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
