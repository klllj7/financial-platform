const ChatSession = require("./chat-session.model");
const ChatMessage = require("./chat-message.model");
const AiToolApplication = require("../ai-tools/ai-tool-application.model");
const { createSolarMessage } = require("./solar.client");
const { createBedrockMessage, invokeBedrockModel } = require("./bedrock.client");
const {
  createOpenAiCompatibleMessage,
} = require("./openai-compatible.client");
const { decryptCredential } = require("../../common/utils/credentialCrypto");
const { Op } = require("sequelize");

const DEFAULT_SOLAR_TOOL_KEY = "DEFAULT_SOLAR";
const DLP_SERVICE_URL = process.env.DLP_SERVICE_URL || "http://localhost:8000";

const serviceError = (code, message, statusCode) => Object.assign(new Error(message), { code, statusCode });

/* 요청한 채팅방이 현재 로그인 사용자의 것인지 확인한다. */
const findOwnedSession = async (userId, sessionId) => {
  const session = await ChatSession.findOne({
    where: { id: sessionId, userId, deletedAt: { [Op.is]: null } },
  });
  if (!session) throw serviceError("CHAT_SESSION_NOT_FOUND", "채팅을 찾을 수 없습니다.", 404);
  return session;
};

const getSessions = (userId) => ChatSession.findAll({
  where: { userId, deletedAt: { [Op.is]: null } },
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

/* 목록에서는 숨기되 감사 로그 보존을 위해 세션과 메시지는 실제 삭제하지 않는다. */
const softDeleteSessions = async ({ userId, sessionIds }) => {
  const sessions = await ChatSession.findAll({
    where: {
      id: { [Op.in]: sessionIds },
      userId,
      deletedAt: { [Op.is]: null },
    },
  });
  const ownedIds = sessions.map((session) => session.id);
  if (ownedIds.length === 0) {
    throw serviceError(
      "CHAT_SESSION_NOT_FOUND",
      "삭제할 채팅을 찾을 수 없습니다.",
      404,
    );
  }

  await ChatSession.update(
    { deletedAt: new Date(), isPinned: false },
    { where: { id: { [Op.in]: ownedIds }, userId } },
  );
  return { sessionIds: ownedIds };
};

/*
  C 담당 DLP 서비스(/gateway/chat)에 텍스트를 보내 PII 탐지·마스킹·차단 여부를 받아온다.
  탐지된 이벤트는 DLP 쪽 usage_log/event_log/action_history에 자동으로 기록되어
  "위험 이벤트 관리" 화면에 바로 반영된다.

  direction으로 사용자 입력 검사와 AI 응답 검사를 구분한다.
  - "input"  : usage_log를 새로 만들고 usage_log_id를 돌려준다.
  - "output" : AI 응답은 사용자의 사용 이력이 아니라서 usage_log를 만들지 않고,
               입력 검사에서 받은 usageLogId에 이벤트만 덧붙인다.
               이 값을 안 넘기면 한 번의 대화가 사용 이력 2건으로 집계된다.

  DLP 서비스가 응답하지 않으면(로컬에서 안 켜져 있는 등) 채팅 자체가 막히지 않도록
  탐지 없이 통과시키고 에러만 로그로 남긴다.
*/
const inspectPrompt = async (message, userId, { direction = "input", usageLogId = null } = {}) => {
  try {
    const response = await fetch(`${DLP_SERVICE_URL}/gateway/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: message,
        user_id: userId,
        direction,
        usage_log_id: usageLogId,
      }),
    });

    if (!response.ok) {
      throw new Error(`DLP 서비스 응답 오류 (status: ${response.status})`);
    }

    const data = await response.json();
    return {
      blocked: data.action_status === "blocked",
      maskApplied: data.action_status === "masked",
      safePrompt: data.prompt ?? message,
      usageLogId: data.usage_log_id ?? null,
    };
  } catch (error) {
    // fetch 실패는 error.message만으로는 원인(DNS 실패/연결 거부/타임아웃 등)이 안 보이고
    // 실제 원인은 error.cause에 담기므로 같이 남긴다.
    console.error(
      "DLP 서비스 호출 실패, 탐지 없이 통과시킵니다:",
      error.message,
      error.cause ? `(cause: ${error.cause})` : "",
    );
    return { blocked: false, maskApplied: false, safePrompt: message, usageLogId: null };
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

  const application = await AiToolApplication.scope("withCredential").findOne({
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
  attachment,
}) => {
  const existingSession = sessionId
    ? await findOwnedSession(userId, sessionId)
    : null;

  /*
    이어지는 대화(기존 세션)는 이번 요청이 들고 온 도구 선택을 무시하고,
    세션이 처음 만들어질 때 고정해 둔 모델을 그대로 쓴다. 그래야 사용자가
    대화 도중 드롭다운에서 다른 모델로 바꿔도 같은 세션 안에서는 모델이
    바뀌지 않는다. (이 컬럼이 생기기 전 만들어진 세션은 고정값이 없으니
    예전처럼 요청값을 신뢰하고, 이번 기회에 세션에 값을 채워 넣는다.)
  */
  const hasPinnedTool = Boolean(
    existingSession?.aiToolApplicationId || existingSession?.toolKey,
  );
  const resolvedSelection = hasPinnedTool
    ? {
      aiToolApplicationId: existingSession.aiToolApplicationId,
      toolKey: existingSession.toolKey,
    }
    : { aiToolApplicationId, toolKey };

  const approvedTool = await findApprovedTool(resolvedSelection);

  const pinnedFields = {
    aiToolApplicationId: approvedTool.isDefaultSolar ? null : approvedTool.id,
    toolKey: approvedTool.isDefaultSolar ? DEFAULT_SOLAR_TOOL_KEY : null,
  };

  const session = existingSession
    ? (!hasPinnedTool ? await existingSession.update(pinnedFields) : existingSession)
    : await ChatSession.create({
      userId,
      title: message
        ? message.length > 30 ? `${message.slice(0, 30)}…` : message
        : attachment.fileName,
      ...pinnedFields,
    });

  const attachmentPrompt = attachment
    ? [
      `첨부파일명: ${attachment.fileName}`,
      "첨부파일 내용:",
      attachment.content,
    ].join("\n")
    : "";
  const combinedPrompt = [message, attachmentPrompt].filter(Boolean).join(
    "\n\n",
  );
  const inspection = await inspectPrompt(combinedPrompt, userId);
  const previousMessages = await ChatMessage.findAll({
    where: { sessionId: session.id },
    order: [["createdAt", "ASC"]],
  });
  const userMessage = await ChatMessage.create({
    sessionId: session.id,
    role: "USER",
    // 대화 화면에는 질문과 첨부파일명만 남기고 파일 본문은 펼쳐 저장하지 않는다.
    content: [
      message,
      attachment ? `[첨부파일: ${attachment.fileName}]` : "",
    ].filter(Boolean).join("\n"),
  });
  const providerUserMessage = {
    ...userMessage.toJSON(),
    content: inspection.blocked ? combinedPrompt : inspection.safePrompt,
  };

  let reply;
  let modelName = null;
  let inputTokens = 0;
  let outputTokens = 0;

  if (inspection.blocked) {
    reply = "보안 정책에 의해 요청이 차단되었습니다. 인증정보나 기밀정보를 제거해 주세요.";
  } else if (approvedTool.isDefaultSolar) {
    const solarResponse = process.env.AI_PROVIDER === "bedrock"
      ? await createBedrockMessage([...previousMessages, providerUserMessage])
      : await createSolarMessage([...previousMessages, providerUserMessage]);
    reply = solarResponse.content;
    modelName = solarResponse.modelName;
    inputTokens = solarResponse.inputTokens;
    outputTokens = solarResponse.outputTokens;
  } else if (approvedTool.modelSource === "BEDROCK" && approvedTool.bedrockModelId) {
    const providerResponse = await invokeBedrockModel({
      modelId: approvedTool.bedrockModelId,
      messages: [...previousMessages, providerUserMessage],
    });
    reply = providerResponse.content;
    modelName = providerResponse.modelName;
    inputTokens = providerResponse.inputTokens;
    outputTokens = providerResponse.outputTokens;
  } else if (
    approvedTool.credentialConfigured &&
    approvedTool.apiKeyEncrypted &&
    approvedTool.apiKeyIv &&
    approvedTool.apiKeyAuthTag
  ) {
    const providerResponse = await createOpenAiCompatibleMessage({
      apiKey: decryptCredential({
        encrypted: approvedTool.apiKeyEncrypted,
        iv: approvedTool.apiKeyIv,
        authTag: approvedTool.apiKeyAuthTag,
      }),
      baseUrl: approvedTool.apiBaseUrl,
      modelId: approvedTool.apiModelId,
      messages: [...previousMessages, providerUserMessage],
    });
    reply = providerResponse.content;
    modelName = providerResponse.modelName;
    inputTokens = providerResponse.inputTokens;
    outputTokens = providerResponse.outputTokens;
  } else {
    throw serviceError(
      "CHAT_TOOL_PROVIDER_NOT_CONFIGURED",
      `${approvedTool.toolName} API 연결정보가 설정되지 않았습니다.`,
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
    outputInspection = await inspectPrompt(reply, userId, {
      direction: "output",
      usageLogId: inspection.usageLogId,
    });
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
  softDeleteSessions,
  sendMessage,
};
