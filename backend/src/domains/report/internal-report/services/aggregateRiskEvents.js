const { Op } = require("sequelize");
const UsageLog = require("../../evidence/usageLog.model");
const EventLog = require("../../evidence/eventLog.model");
const ActionHistory = require("../../evidence/actionHistory.model");

// ⚠️ detector.py(backend/src/domains/dlp/detector.py)가 source of truth다.
// PII_GRADES / GRADE_ORDER 값이 detector.py에서 바뀌면 이 파일도 반드시 함께 수정해야 한다.
const PII_GRADES = {
  resident_number: "HIGH",
  card_number: "HIGH",
  prompt_injection: "HIGH",
  confidential_similarity: "HIGH",
  account_number: "MEDIUM",
  phone_number: "MEDIUM",
  email: "LOW",
};
const GRADE_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 };
const BLOCK_TYPES = new Set(["resident_number", "prompt_injection", "confidential_similarity"]);
const PII_TYPES = new Set(["resident_number", "phone_number", "account_number", "card_number", "email"]);

/**
 * EventLog + UsageLog + ActionHistory를 조인해서 "유형 1건당 1로우"로 펼친다.
 * detection_type이 콤마로 여러 유형을 담고 있어서 그대로 group-by 하면 안 되기 때문.
 */
const getExpandedRiskEvents = async ({ from, to } = {}) => {
  const where = from && to ? { created_at: { [Op.between]: [from, to] } } : {};

  const events = await EventLog.findAll({ where, order: [["created_at", "DESC"]] });
  const usageLogIds = events.map((e) => e.event_id);

  const [usageLogs, actions] = await Promise.all([
    usageLogIds.length ? UsageLog.findAll({ where: { id: { [Op.in]: usageLogIds } } }) : [],
    usageLogIds.length ? ActionHistory.findAll({ where: { event_id: { [Op.in]: usageLogIds } } }) : [],
  ]);
  const usageById = new Map(usageLogs.map((u) => [u.id, u]));
  const actionsByEventId = new Map();
  actions.forEach((a) => {
    const list = actionsByEventId.get(a.event_id) || [];
    list.push(a);
    actionsByEventId.set(a.event_id, list);
  });

  const expanded = [];
  for (const event of events) {
    const types = event.detection_type ? event.detection_type.split(",") : [];
    const usage = usageById.get(event.event_id);
    // 자동 조치는 자기 방향 것만 본다. 담당자의 수동 조치(direction=NULL)는
    // 요청 전체에 대한 판단이라 입력·출력 양쪽에 모두 해당한다.
    const eventActions = (actionsByEventId.get(event.event_id) || []).filter(
      (a) => a.direction == null || a.direction === event.direction,
    );
    for (const type of types) {
      expanded.push({
        eventId: event.event_id,
        // 하나의 usage_log에 입력·출력 이벤트가 함께 달릴 수 있어 event_id만으로는
        // 행을 특정할 수 없다.
        eventLogId: event.id,
        direction: event.direction ?? "input",
        type,
        grade: PII_GRADES[type] || "LOW", // 유형별 고정 등급 (요청 단위 grade가 아님)
        similarityScore: event.similarity_score,
        createdAt: event.createdAt,
        // 원문(description) 금지 — 결과/리포트에는 마스킹본만 쓴다.
        // 출력 이벤트가 탐지한 건 AI 응답이라 usage_log가 아니라 event_log에 들어있다.
        maskedDescription:
          event.direction === "output"
            ? event.masked_description ?? null
            : usage?.masked_description ?? null,
        actionStatus: eventActions[0]?.action_type ?? null,
      });
    }
  }
  return expanded;
};

/** ①번용: 최근 90일 유형별 탐지 건수 */
const getThreatTypeCounts90d = async () => {
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const rows = await getExpandedRiskEvents({ from, to: new Date() });
  const counts = {};
  rows.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
  return counts;
};

/** ②번용: 유형별 건수·등급·처리유형 분포 */
const getThreatClassification = async ({ from, to } = {}) => {
  const rows = await getExpandedRiskEvents({ from, to });
  const grouped = {};
  rows.forEach((r) => {
    grouped[r.type] ??= { count: 0, grade: r.grade, actionCounts: {} };
    grouped[r.type].count += 1;
    grouped[r.type].actionCounts[r.actionStatus] =
      (grouped[r.type].actionCounts[r.actionStatus] || 0) + 1;
  });
  return grouped;
};

/** ③번용: 건수 × 등급가중치 스코어 우선순위 */
const getThreatPriority = async ({ from, to } = {}) => {
  const grouped = await getThreatClassification({ from, to });
  return Object.entries(grouped)
    .map(([type, v]) => ({
      type,
      count: v.count,
      grade: v.grade,
      score: v.count * GRADE_ORDER[v.grade],
    }))
    .sort((a, b) => b.score - a.score || GRADE_ORDER[b.grade] - GRADE_ORDER[a.grade] || b.count - a.count);
};

module.exports = {
  getExpandedRiskEvents,
  getThreatTypeCounts90d,
  getThreatClassification,
  getThreatPriority,
  PII_GRADES,
  GRADE_ORDER,
  BLOCK_TYPES,
  PII_TYPES,
};
