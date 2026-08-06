const service = require("./chat.service");
const { success, fail } = require("../../common/utils/response");
const path = require("path");
const pdfParse = require("pdf-parse");

const extractAttachmentContent = async (file) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension !== ".pdf") {
    return file.buffer.toString("utf8").replace(/\0/g, "").trim();
  }

  try {
    const parsedPdf = await pdfParse(file.buffer);
    return parsedPdf.text.replace(/\0/g, "").trim();
  } catch (parseError) {
    const error = new Error(
      "PDF 내용을 읽을 수 없습니다. 암호화되거나 손상된 파일인지 확인해 주세요.",
    );
    error.code = "CHAT_PDF_PARSE_FAILED";
    error.statusCode = 400;
    error.cause = parseError;
    throw error;
  }
};

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

const deleteSessions = async (req, res) => {
  try {
    const sessionIds = Array.isArray(req.body.sessionIds)
      ? [...new Set(req.body.sessionIds.filter((id) => typeof id === "string"))]
      : [];
    if (sessionIds.length === 0) {
      return fail(
        res,
        "CHAT_DELETE_SELECTION_REQUIRED",
        "삭제할 채팅을 선택해 주세요.",
        400,
      );
    }

    return success(res, await service.softDeleteSessions({
      userId: req.user.userId,
      sessionIds,
    }));
  } catch (error) {
    return fail(
      res,
      error.code || "CHAT_DELETE_FAILED",
      error.message,
      error.statusCode || 500,
    );
  }
};

const sendMessage = async (req, res) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    const attachment = req.file
      ? {
        fileName: req.file.originalname,
        content: await extractAttachmentContent(req.file),
      }
      : null;
    if (!message && !attachment) {
      return fail(res, "CHAT_MESSAGE_REQUIRED", "질문을 입력하거나 파일을 첨부해 주세요.", 400);
    }
    if (message.length > 5000) return fail(res, "CHAT_MESSAGE_TOO_LONG", "질문은 5,000자 이하로 입력해 주세요.", 400);
    if (attachment && !attachment.content) {
      return fail(res, "CHAT_ATTACHMENT_EMPTY", "첨부파일에 읽을 수 있는 내용이 없습니다.", 400);
    }
    if (attachment?.content.length > 50000) {
      return fail(res, "CHAT_ATTACHMENT_TOO_LONG", "첨부파일 내용은 50,000자 이하만 처리할 수 있습니다.", 400);
    }
    return success(res, await service.sendMessage({
      userId: req.user.userId,
      roleCode: req.user.roleCode,
      sessionId: req.body.sessionId,
      aiToolApplicationId: req.body.aiToolApplicationId,
      toolKey: req.body.toolKey,
      message,
      attachment,
    }), 201);
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return fail(res, "CHAT_ATTACHMENT_TOO_LARGE", "첨부파일은 최대 2MB까지 가능합니다.", 400);
    }
    return fail(res, error.code || "CHAT_SEND_FAILED", error.message, error.statusCode || 500);
  }
};

module.exports = {
  getSessions,
  getMessages,
  updatePin,
  deleteSessions,
  sendMessage,
};
