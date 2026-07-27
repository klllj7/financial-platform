const { Op } = require("sequelize");
const ChatSession = require("../chat/chat-session.model");
const ChatMessage = require("../chat/chat-message.model");

/* 조회 월의 시작일·종료일을 계산한다. month 형식은 YYYY-MM이다. */
const getMonthRange = (month) => {
  const now = new Date();
  const matched = /^(\d{4})-(\d{2})$/.exec(month || "");
  const year = matched ? Number(matched[1]) : now.getFullYear();
  const monthIndex = matched ? Number(matched[2]) - 1 : now.getMonth();

  if (monthIndex < 0 || monthIndex > 11) {
    const error = new Error("month는 YYYY-MM 형식이어야 합니다.");
    error.statusCode = 400;
    error.code = "DASHBOARD_INVALID_MONTH";
    throw error;
  }

  return {
    start: new Date(year, monthIndex, 1),
    end: new Date(year, monthIndex + 1, 1),
    previousStart: new Date(year, monthIndex - 1, 1),
  };
};

/* 로그인 사용자의 채팅만 조회하도록 모든 통계 쿼리에 동일한 조건을 사용한다. */
const ownedSessionInclude = (userId) => [{
  model: ChatSession,
  as: "session",
  attributes: [],
  required: true,
  where: { userId },
}];

const getRiskLevel = (message) => {
  if (message.blocked) return "HIGH";
  if (message.maskApplied) return "MEDIUM";
  return "LOW";
};

const toUsageItem = (message) => ({
  id: message.id,
  occurredAt: message.createdAt,
  aiToolId: message.modelName || null,
  toolName: message.modelName || "미지정 모델",
  provider: "-",
  detectionType: message.blocked
    ? "보안 정책 차단"
    : message.maskApplied
      ? "민감정보 마스킹"
      : "일반 질의",
  riskLevel: getRiskLevel(message),
  actionStatus: message.blocked
    ? "경고 발송"
    : message.maskApplied
      ? "모니터링"
      : "조치없음",
});

const getAssistantMessages = ({ userId, start, end }) =>
  ChatMessage.findAll({
    where: {
      role: "ASSISTANT",
      createdAt: { [Op.gte]: start, [Op.lt]: end },
    },
    include: ownedSessionInclude(userId),
    order: [["createdAt", "DESC"]],
  });

/* 대시보드 상단 카드에 사용할 월간 요약을 계산한다. */
const getSummary = async ({ userId, month }) => {
  const { start, end, previousStart } = getMonthRange(month);
  const [messages, previousUsageCount] = await Promise.all([
    getAssistantMessages({ userId, start, end }),
    ChatMessage.count({
      where: {
        role: "USER",
        createdAt: { [Op.gte]: previousStart, [Op.lt]: start },
      },
      include: ownedSessionInclude(userId),
    }),
  ]);

  const usageCount = messages.length;
  const riskMessages = messages.filter(
    (message) => message.blocked || message.maskApplied,
  );

  return {
    riskEventCount: riskMessages.length,
    mediumOrHigherCount: riskMessages.length,
    usageCount,
    previousMonthDifference: usageCount - previousUsageCount,
    // 현재 채팅 저장 모델에는 토큰·비용 컬럼이 없으므로 임의 계산하지 않는다.
    totalTokens: 0,
    totalCostKrw: 0,
  };
};

/* 최근 N일의 사용 횟수와 위험 이벤트를 날짜별로 반환한다. */
const getTrend = async ({ userId, days }) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date();
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);

  const messages = await getAssistantMessages({ userId, start, end });
  const buckets = new Map();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      usageCount: 0,
      riskEventCount: 0,
    });
  }

  messages.forEach((message) => {
    const key = new Date(message.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.usageCount += 1;
    if (message.blocked || message.maskApplied) bucket.riskEventCount += 1;
  });

  return { items: [...buckets.values()] };
};

/* 모든 임직원의 AI 응답을 날짜별로 집계해 전사 사용 추이를 반환한다. */
const getComplianceTrend = async ({ days }) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date();
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);

  const messages = await ChatMessage.findAll({
    attributes: ["createdAt"],
    where: {
      role: "ASSISTANT",
      createdAt: { [Op.gte]: start, [Op.lt]: end },
    },
  });
  const buckets = new Map();

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, { date: key, usageCount: 0 });
  }

  messages.forEach((message) => {
    const key = new Date(message.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.usageCount += 1;
  });

  return { items: [...buckets.values()] };
};

/* 이번 달 전사 AI 사용 횟수와 Solar 실제 토큰 사용량을 집계한다. */
const getComplianceSummary = async ({ month }) => {
  const { start, end, previousStart } = getMonthRange(month);
  const [messages, previousUsageCount] = await Promise.all([
    ChatMessage.findAll({
      attributes: ["inputTokens", "outputTokens"],
      where: {
        role: "ASSISTANT",
        createdAt: { [Op.gte]: start, [Op.lt]: end },
      },
    }),
    ChatMessage.count({
      where: {
        role: "ASSISTANT",
        createdAt: { [Op.gte]: previousStart, [Op.lt]: start },
      },
    }),
  ]);

  const inputTokens = messages.reduce(
    (sum, message) => sum + Number(message.inputTokens || 0),
    0,
  );
  const outputTokens = messages.reduce(
    (sum, message) => sum + Number(message.outputTokens || 0),
    0,
  );
  const inputRate = Number(
    process.env.ANTHROPIC_INPUT_COST_USD_PER_MILLION || 0,
  );
  const outputRate = Number(
    process.env.ANTHROPIC_OUTPUT_COST_USD_PER_MILLION || 0,
  );
  const usdToKrw = Number(process.env.USD_TO_KRW_RATE || 0);
  const estimatedCostKrw = Math.round(
    ((inputTokens * inputRate + outputTokens * outputRate) / 1_000_000) *
      usdToKrw,
  );

  return {
    usageCount: messages.length,
    previousMonthDifference: messages.length - previousUsageCount,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostKrw,
  };
};

/* 조회 월의 모델별 사용 횟수와 비율을 계산한다. */
const getModels = async ({ userId, month }) => {
  const { start, end } = getMonthRange(month);
  const messages = await getAssistantMessages({ userId, start, end });
  const counts = new Map();

  messages.forEach((message) => {
    const modelName = message.modelName || "미지정 모델";
    counts.set(modelName, (counts.get(modelName) || 0) + 1);
  });

  return {
    models: [...counts.entries()]
      .map(([modelName, usageCount]) => ({
        modelName,
        usageCount,
        ratio: messages.length
          ? Number(((usageCount / messages.length) * 100).toFixed(1))
          : 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount),
  };
};

const getRecent = async ({ userId, limit }) => {
  const messages = await ChatMessage.findAll({
    where: { role: "ASSISTANT" },
    include: ownedSessionInclude(userId),
    order: [["createdAt", "DESC"]],
    limit,
  });
  return { items: messages.map(toUsageItem) };
};

/* 전체 사용 이력은 월·위험등급·모델 조건과 페이지네이션을 지원한다. */
const getUsage = async ({
  userId,
  page,
  size,
  month,
  riskLevel,
  aiToolId,
}) => {
  const { start, end } = getMonthRange(month);
  const where = {
    role: "ASSISTANT",
    createdAt: { [Op.gte]: start, [Op.lt]: end },
  };

  if (aiToolId) where.modelName = aiToolId;
  if (riskLevel === "HIGH") where.blocked = true;
  if (riskLevel === "MEDIUM") {
    where.blocked = false;
    where.maskApplied = true;
  }
  if (riskLevel === "LOW") {
    where.blocked = false;
    where.maskApplied = false;
  }

  const result = await ChatMessage.findAndCountAll({
    where,
    include: ownedSessionInclude(userId),
    order: [["createdAt", "DESC"]],
    limit: size,
    offset: page * size,
    distinct: true,
  });

  return {
    content: result.rows.map(toUsageItem),
    totalElements: result.count,
    totalPages: Math.ceil(result.count / size),
  };
};

module.exports = {
  getSummary,
  getTrend,
  getComplianceTrend,
  getComplianceSummary,
  getModels,
  getRecent,
  getUsage,
};
