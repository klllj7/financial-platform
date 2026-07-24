const express = require("express");
const controller = require("./chat.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.get("/sessions", controller.getSessions);
router.get("/sessions/:sessionId/messages", controller.getMessages);
router.patch("/sessions/:sessionId/pin", controller.updatePin);
router.post("/messages", controller.sendMessage);

module.exports = router;
