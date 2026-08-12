const { Op } = require("sequelize");
const ChatSession = require("../chat/chat-session.model");
const ChatMessage = require("../chat/chat-message.model");
const { ALLOWED_MODELS } = require("../chat/allowed-models.config");

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

const getLocalDateKey = (value) => {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
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
    const key = getLocalDateKey(date);
    buckets.set(key, {
      date: key,
      usageCount: 0,
      riskEventCount: 0,
    });
  }

  messages.forEach((message) => {
    const key = getLocalDateKey(message.createdAt);
    const bucket = buckets.get(key);
    if (!bucket) return;
    bucket.usageCount += 1;
    if (message.blocked || message.maskApplied) bucket.riskEventCount += 1;
  });

  return { items: [...buckets.values()] };
};

/* 선택한 월의 모든 임직원 AI 응답을 날짜별로 집계한다. */
const getComplianceTrend = async ({ month }) => {
  const { start, end } = getMonthRange(month);

  const messages = await ChatMessage.findAll({
    attributes: ["createdAt"],
    where: {
      role: "ASSISTANT",
      createdAt: { [Op.gte]: start, [Op.lt]: end },
    },
  });
  const buckets = new Map();

  for (
    const date = new Date(start);
    date < end;
    date.setDate(date.getDate() + 1)
  ) {
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

/* 이번 달 전사 AI 사용 횟수와 Bedrock(Anthropic) 응답 기준 실제 토큰 사용량을 집계한다. */
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
  /*
    단가 환경변수가 비어있는 것과 "계산 결과가 실제로 0원"인 것은 다른
    상황이라 구분해야 한다. 비어있으면 0으로 채워 계산하지 말고, 프론트에
    "단가 미설정"이라고 알릴 수 있도록 costRatesConfigured 플래그를 같이 준다.
  */
  const inputRateRaw = process.env.ANTHROPIC_INPUT_COST_USD_PER_MILLION;
  const outputRateRaw = process.env.ANTHROPIC_OUTPUT_COST_USD_PER_MILLION;
  const usdToKrwRaw = process.env.USD_TO_KRW_RATE;
  const costRatesConfigured = Boolean(inputRateRaw) && Boolean(outputRateRaw) && Boolean(usdToKrwRaw);

  const inputRate = Number(inputRateRaw || 0);
  const outputRate = Number(outputRateRaw || 0);
  const usdToKrw = Number(usdToKrwRaw || 0);
  const estimatedCostKrw = costRatesConfigured
    ? Math.round(
      ((inputTokens * inputRate + outputTokens * outputRate) / 1_000_000) *
        usdToKrw,
    )
    : null;

  return {
    usageCount: messages.length,
    previousMonthDifference: messages.length - previousUsageCount,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostKrw,
    costRatesConfigured,
  };
};

/*
  조회 월의 모델별 사용 횟수와 비율을 계산한다. 예전 라벨(Bedrock 전환 전
  "Solar Pro 3"였거나, 표시 이름을 통일하기 전의 원본 카탈로그 이름 등)이
  섞여 있으면 같은 모델인데 화면에는 여러 조각으로 쪼개져 보이므로,
  지금 실제로 신청·승인 가능한 모델(ALLOWED_MODELS) 기준으로만 집계한다.
*/
const getModels = async ({ userId, month }) => {
  const { start, end } = getMonthRange(month);
  const messages = await getAssistantMessages({ userId, start, end });
  const allowedModelNames = new Set(ALLOWED_MODELS.map((model) => model.displayName));
  const currentMessages = messages.filter((message) => allowedModelNames.has(message.modelName));
  const counts = new Map();

  currentMessages.forEach((message) => {
    counts.set(message.modelName, (counts.get(message.modelName) || 0) + 1);
  });

  return {
    models: [...counts.entries()]
      .map(([modelName, usageCount]) => ({
        modelName,
        usageCount,
        ratio: currentMessages.length
          ? Number(((usageCount / currentMessages.length) * 100).toFixed(1))
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
  date,
  riskLevel,
  aiToolId,
}) => {
  let start;
  let end;
  if (date) {
    const matchedDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const selectedDate = matchedDate
      ? new Date(
        Number(matchedDate[1]),
        Number(matchedDate[2]) - 1,
        Number(matchedDate[3]),
      )
      : null;

    if (
      !selectedDate ||
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.getFullYear() !== Number(matchedDate[1]) ||
      selectedDate.getMonth() !== Number(matchedDate[2]) - 1 ||
      selectedDate.getDate() !== Number(matchedDate[3])
    ) {
      const error = new Error("date는 YYYY-MM-DD 형식의 유효한 날짜여야 합니다.");
      error.statusCode = 400;
      error.code = "DASHBOARD_INVALID_DATE";
      throw error;
    }

    start = selectedDate;
    end = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate() + 1,
    );
  } else if (month) {
    ({ start, end } = getMonthRange(month));
  }
  const where = {
    role: "ASSISTANT",
  };
  if (start && end) {
    where.createdAt = { [Op.gte]: start, [Op.lt]: end };
  }

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
