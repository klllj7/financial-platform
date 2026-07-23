import { Router } from "express";

import {
  getAvailableModels,
  sendChatMessage,
} from "./chat/chat.controller.js";

const router = Router();

/**
 * AI 채팅 요청
 * POST /api/chat
 */
router.get("/chat/models", getAvailableModels);

/**
 * AI 채팅 요청
 * POST /api/chat
 */
router.post("/chat", sendChatMessage);

export default router;