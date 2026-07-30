const service = require("./dashboard.service");
const { success, fail } = require("../../common/utils/response");

const handle = (handler, errorCode) => async (req, res) => {
  try {
    return success(res, await handler());
  } catch (error) {
    return fail(res, error.code || errorCode, error.message, error.statusCode || 500);
  }
};

const summary = (req, res) =>
  handle(
    () => service.getSummary({ userId: req.user.userId, month: req.query.month }),
    "DASHBOARD_SUMMARY_FAILED",
  )(req, res);

const trend = (req, res) => {
  const value = Number(req.query.days || 7);
  const days = Number.isInteger(value) ? Math.min(Math.max(value, 1), 31) : 7;
  return handle(
    () => service.getTrend({ userId: req.user.userId, days }),
    "DASHBOARD_TREND_FAILED",
  )(req, res);
};

/* 전사 사용 추이는 선택한 월의 일별 데이터로 조회한다. */
const complianceTrend = (req, res) =>
  handle(
    () => service.getComplianceTrend({ month: req.query.month }),
    "DASHBOARD_COMPLIANCE_TREND_FAILED",
  )(req, res);

/* 컴플라이언스 상단 카드에 사용할 이번 달 전사 사용 요약을 조회한다. */
const complianceSummary = (req, res) =>
  handle(
    () => service.getComplianceSummary({ month: req.query.month }),
    "DASHBOARD_COMPLIANCE_SUMMARY_FAILED",
  )(req, res);

const models = (req, res) =>
  handle(
    () => service.getModels({ userId: req.user.userId, month: req.query.month }),
    "DASHBOARD_MODELS_FAILED",
  )(req, res);

const recent = (req, res) => {
  const value = Number(req.query.limit || 5);
  const limit = Number.isInteger(value) ? Math.min(Math.max(value, 1), 20) : 5;
  return handle(
    () => service.getRecent({ userId: req.user.userId, limit }),
    "DASHBOARD_RECENT_FAILED",
  )(req, res);
};

const usage = (req, res) => {
  const page = Math.max(Number(req.query.page) || 0, 0);
  const size = Math.min(Math.max(Number(req.query.size) || 10, 1), 100);
  return handle(
    () => service.getUsage({
      userId: req.user.userId,
      page,
      size,
      month: req.query.month,
      date: req.query.date,
      riskLevel: req.query.riskLevel,
      aiToolId: req.query.aiToolId,
    }),
    "DASHBOARD_USAGE_FAILED",
  )(req, res);
};

module.exports = {
  summary,
  trend,
  complianceTrend,
  complianceSummary,
  models,
  recent,
  usage,
};
