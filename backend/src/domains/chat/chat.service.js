const ChatSession = require("./chat-session.model");
const ChatMessage = require("./chat-message.model");

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

const sendMessage = async ({ userId, sessionId, message }) => {
  const session = sessionId
    ? await findOwnedSession(userId, sessionId)
    : await ChatSession.create({
      userId,
      title: message.length > 30 ? `${message.slice(0, 30)}…` : message,
    });

  const userMessage = await ChatMessage.create({ sessionId: session.id, role: "USER", content: message });
  const inspection = inspectPrompt(message);
  const reply = inspection.blocked
    ? "보안 정책에 의해 요청이 차단되었습니다. 인증정보나 기밀정보를 제거해 주세요."
    : `${inspection.maskApplied ? "민감정보를 마스킹한 뒤 " : ""}요청 내용을 확인했습니다. 업무 활용 전 담당자의 검토를 거쳐 주세요.`;

  const assistantMessage = await ChatMessage.create({
    sessionId: session.id,
    role: "ASSISTANT",
    content: reply,
    blocked: inspection.blocked,
    maskApplied: inspection.maskApplied,
    modelName: inspection.blocked ? null : "MOCK_MODEL",
  });

  await session.update({ updatedAt: new Date() }, { silent: false });
  return { session, userMessage, assistantMessage };
};

module.exports = { getSessions, getMessages, updatePin, sendMessage };
