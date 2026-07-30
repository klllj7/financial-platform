const express = require("express");
const controller = require("./chat.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");
const uploadChatAttachment = require("./chat-upload.middleware");
const { fail } = require("../../common/utils/response");

const router = express.Router();
router.use(authenticate);
router.get("/sessions", controller.getSessions);
router.get("/sessions/:sessionId/messages", controller.getMessages);
router.patch("/sessions/:sessionId/pin", controller.updatePin);
router.delete("/sessions", controller.deleteSessions);
router.post(
  "/messages",
  (req, res, next) => {
    uploadChatAttachment(req, res, (error) => {
      if (!error) return next();
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "첨부파일은 최대 2MB까지 가능합니다."
        : error.message;
      return fail(
        res,
        error.code || "CHAT_ATTACHMENT_UPLOAD_FAILED",
        message,
        error.statusCode || 400,
      );
    });
  },
  controller.sendMessage,
);

module.exports = router;
