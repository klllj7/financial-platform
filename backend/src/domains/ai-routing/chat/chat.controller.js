import {
  findAvailableModels,
  processChat,
} from "./chat.service.js";

export function getAvailableModels(req, res, next) {
  try {
    const tools = findAvailableModels();

    return res.status(200).json({
      success: true,
      data: {
        tools,
      },
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

export async function sendChatMessage(req, res, next) {
  try {
    const {
      message,
      sessionId,
      aiToolId,
      promptStorageId,
    } = req.body;

    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: "CHAT_001",
          message: "message는 필수 입력값입니다.",
        },
      });
    }

    const result = await processChat({
      message: message.trim(),
      sessionId,
      aiToolId,
      promptStorageId,
    });

    return res.status(200).json({
      success: true,
      data: result,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}