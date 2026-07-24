const service = require("./chat.service");
const { success, fail } = require("../../common/utils/response");

const getSessions = async (req, res) => {
  try { return success(res, await service.getSessions(req.user.userId)); }
  catch (error) { return fail(res, error.code || "CHAT_LIST_FAILED", error.message, error.statusCode || 500); }
};

const getMessages = async (req, res) => {
  try { return success(res, await service.getMessages({ userId: req.user.userId, sessionId: req.params.sessionId })); }
  catch (error) { return fail(res, error.code || "CHAT_MESSAGES_FAILED", error.message, error.statusCode || 500); }
};

const updatePin = async (req, res) => {
  try {
    if (typeof req.body.isPinned !== "boolean") return fail(res, "CHAT_PIN_REQUIRED", "isPinned 값이 필요합니다.", 400);
    return success(res, await service.updatePin({ userId: req.user.userId, sessionId: req.params.sessionId, isPinned: req.body.isPinned }));
  } catch (error) { return fail(res, error.code || "CHAT_PIN_FAILED", error.message, error.statusCode || 500); }
};

const sendMessage = async (req, res) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message) return fail(res, "CHAT_MESSAGE_REQUIRED", "질문을 입력해 주세요.", 400);
    if (message.length > 5000) return fail(res, "CHAT_MESSAGE_TOO_LONG", "질문은 5,000자 이하로 입력해 주세요.", 400);
    return success(res, await service.sendMessage({ userId: req.user.userId, sessionId: req.body.sessionId, message }), 201);
  } catch (error) { return fail(res, error.code || "CHAT_SEND_FAILED", error.message, error.statusCode || 500); }
};

module.exports = { getSessions, getMessages, updatePin, sendMessage };
