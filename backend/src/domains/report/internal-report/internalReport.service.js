const axios = require("axios");
const { Op } = require("sequelize");
const InternalReport = require("./internalReport.model");
const Department = require("../../auth/department.model");
const User = require("../../auth/user.model");

// frontend/src/utils/detectionType.js와 동일하게 유지해야 한다(코드 -> 한국어 라벨).
const DETECTION_TYPE_LABELS = {
  resident_number: "주민등록번호",
  phone_number: "휴대폰번호",
  account_number: "계좌번호",
  card_number: "카드번호",
  email: "이메일",
  prompt_injection: "프롬프트 인젝션",
  confidential_similarity: "기밀·민감정보 유사",
};

const formatDetectionType = (detectionType) =>
  (detectionType ?? "")
    .split(",")
    .map((type) => type.trim())
    .filter(Boolean)
    .map((type) => DETECTION_TYPE_LABELS[type] ?? type)
    .join(" · ");

const RISK_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2 };

const ACTION_TYPE_LABEL = {
  reviewed: "모니터링",
  escalated: "조치 중",
  dismissed: "조치 완료",
};

const REPORT_TYPE_LABEL = {
  REGULAR: "정기보고",
  AD_HOC: "수시보고",
};

const MAIN_DEPARTMENT_LIMIT = 5;
const MAIN_EVENT_LIMIT = 10;

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";
  return toDateInputValue(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* 이벤트의 조치 이력 중 가장 최근 조치를 반환 */
function getLatestAction(actions = []) {
  if (actions.length === 0) return null;
  return [...actions].sort(
    (a, b) => new Date(b.action_time || 0).getTime() - new Date(a.action_time || 0).getTime()
  )[0];
}

/* 최근 조치가 완료(dismissed) 상태인지 확인 */
function isEventResolved(event) {
  const latestAction = getLatestAction(event.actions);
  return latestAction?.action_type === "dismissed";
}

/* 보고서에 표시할 이벤트 조치 상태를 반환 */
function getEventStatus(event) {
  const latestAction = getLatestAction(event.actions);
  if (!latestAction) return "미조치";
  return ACTION_TYPE_LABEL[latestAction.action_type] ?? latestAction.action_type ?? "미확인";
}

/**
 * InternalReportPage.jsx의 useMemo 블록들을 1:1로 포팅한 순수 계산 함수.
 * 유일한 의도적 차이: description(원문) 대신 masked_description(마스킹본)만 사용한다
 * — 이번엔 결과가 DB에 영구 저장되는 스냅샷이라 원문 노출 리스크가 더 크기 때문.
 */
const buildReportSnapshot = ({ events, departmentNames, department, periodStart, periodEnd, riskThreshold }) => {
  const filteredEvents = events
    .filter((event) => {
      const eventDate = event.createdAt ? formatDate(event.createdAt) : null;
      const inPeriod = !eventDate || (eventDate >= periodStart && eventDate <= periodEnd);
      const inDepartment = department === "전체" || event.department === department;

      const riskRank = RISK_ORDER[event.riskLevel] ?? 0;
      const meetsRisk =
        riskThreshold === "ALL" ||
        (riskThreshold === "MEDIUM_UP" && riskRank >= RISK_ORDER.MEDIUM) ||
        (riskThreshold === "HIGH_ONLY" && riskRank === RISK_ORDER.HIGH);

      return inPeriod && inDepartment && meetsRisk;
    })
    // 조치 상태는 렌더링 시점이 아니라 스냅샷 생성 시점에 고정해야 하므로 미리 계산해 둔다.
    .map((event) => ({
      ...event,
      resolved: isEventResolved(event),
      status: getEventStatus(event),
      createdAtDisplay: formatDateTime(event.createdAt),
    }));

  const riskCount = filteredEvents.reduce(
    (acc, event) => {
      const key = event.riskLevel.toLowerCase();
      if (acc[key] !== undefined) acc[key] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  );

  const baseDepartments =
    department !== "전체"
      ? [department]
      : departmentNames.length > 0
      ? departmentNames
      : Array.from(new Set(events.map((e) => e.department)));

  const buckets = new Map();
  baseDepartments.forEach((name) => {
    buckets.set(name, { department: name, high: 0, medium: 0, low: 0 });
  });
  filteredEvents.forEach((event) => {
    const current = buckets.get(event.department) ?? { department: event.department, high: 0, medium: 0, low: 0 };
    const key = event.riskLevel.toLowerCase();
    if (current[key] !== undefined) current[key] += 1;
    buckets.set(event.department, current);
  });
  const departmentSummaries = [...buckets.values()]
    .map((row) => ({ ...row, total: row.high + row.medium + row.low }))
    .sort((a, b) => b.total - a.total);

  const actionHistory = filteredEvents
    .flatMap((event) =>
      (event.actions || []).map((action, index) => ({
        id: `${event.id}-${index}`,
        department: event.department,
        userName: event.userName,
        eventType: event.eventType,
        actionType: action.action_type ?? "",
        actionLabel: ACTION_TYPE_LABEL[action.action_type] ?? action.action_type ?? "-",
        // DLP /events 응답의 actions[]는 이름이 아니라 actor_user_id(숫자)만 내려준다.
        actorName: action.actor_user_id ?? "-",
        reason: action.action_reason ?? "-",
        actedAt: formatDateTime(action.action_time),
        actedAtRaw: action.action_time ?? "",
      }))
    )
    .sort((a, b) => (a.actedAtRaw < b.actedAtRaw ? 1 : -1));

  const completedActionEventCount = filteredEvents.filter((event) =>
    (event.actions || []).some((a) => a.action_type === "dismissed")
  ).length;

  const unresolvedEventCount = filteredEvents.filter((event) => !isEventResolved(event)).length;
  const totalCount = filteredEvents.length;
  const actionCompletionRate = totalCount === 0 ? 0 : Math.round((completedActionEventCount / totalCount) * 100);
  const affectedDepartmentCount = new Set(filteredEvents.map((event) => event.department)).size;

  const departmentsWithEvents = departmentSummaries.filter((row) => row.total > 0);
  const highestRiskDepartment = departmentsWithEvents[0] ?? null;

  const majorRiskEvents = [...filteredEvents]
    .sort((a, b) => {
      const aIsHigh = a.riskLevel === "HIGH" ? 1 : 0;
      const bIsHigh = b.riskLevel === "HIGH" ? 1 : 0;
      if (aIsHigh !== bIsHigh) return bIsHigh - aIsHigh;

      const aIsUnresolved = isEventResolved(a) ? 0 : 1;
      const bIsUnresolved = isEventResolved(b) ? 0 : 1;
      if (aIsUnresolved !== bIsUnresolved) return bIsUnresolved - aIsUnresolved;

      const riskDifference = (RISK_ORDER[b.riskLevel] ?? 0) - (RISK_ORDER[a.riskLevel] ?? 0);
      if (riskDifference !== 0) return riskDifference;

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    .slice(0, MAIN_EVENT_LIMIT)
    .map((event) => ({
      ...event,
      resolved: isEventResolved(event),
      status: getEventStatus(event),
      createdAtDisplay: formatDateTime(event.createdAt),
    }));

  const actionTypeCount = actionHistory.reduce(
    (acc, action) => {
      if (action.actionType === "reviewed") acc.reviewed += 1;
      else if (action.actionType === "escalated") acc.escalated += 1;
      else if (action.actionType === "dismissed") acc.dismissed += 1;
      return acc;
    },
    { reviewed: 0, escalated: 0, dismissed: 0 }
  );

  const unresolvedHighCount = filteredEvents.filter(
    (event) => event.riskLevel === "HIGH" && !isEventResolved(event)
  ).length;

  const complianceStatus =
    totalCount === 0
      ? { code: "NORMAL", label: "특이사항 없음" }
      : unresolvedHighCount > 0
      ? { code: "REVIEW_REQUIRED", label: "중점 검토 필요" }
      : unresolvedEventCount > 0
      ? { code: "FOLLOW_UP_REQUIRED", label: "후속 조치 필요" }
      : { code: "MANAGED", label: "조치 완료" };

  const complianceReviewItems = [
    {
      id: "policy",
      category: "내부 정책 준수",
      status: totalCount === 0 ? "특이사항 없음" : `${totalCount}건 탐지`,
      opinion:
        totalCount === 0
          ? "보고 기간 중 내부 정책 위반 의심 이벤트가 탐지되지 않았습니다."
          : "탐지된 이벤트는 사내 생성형 AI 사용 정책과 DLP 운영 기준에 따라 검토가 필요합니다.",
    },
    {
      id: "high-risk",
      category: "중대 위험 검토",
      status: unresolvedHighCount > 0 ? `${unresolvedHighCount}건 미완료` : "미완료 없음",
      opinion:
        unresolvedHighCount > 0
          ? "미완료 HIGH 등급 이벤트를 우선 검토하고 담당 부서의 조치 결과를 확인해야 합니다."
          : "현재 미완료 상태의 HIGH 등급 이벤트는 확인되지 않았습니다.",
    },
    {
      id: "action",
      category: "조치 이행 상태",
      status: unresolvedEventCount > 0 ? `${unresolvedEventCount}건 미완료` : "조치 완료",
      opinion:
        unresolvedEventCount > 0
          ? "미완료 이벤트의 담당자, 예정일 및 최종 조치 결과를 지속적으로 관리해야 합니다."
          : "현재 보고 대상 이벤트의 조치가 완료된 상태입니다.",
    },
    {
      id: "record",
      category: "감사 기록 관리",
      status: "기록 유지",
      opinion:
        actionHistory.length > 0
          ? `총 ${actionHistory.length}건의 조치 이력이 확인되며 감사 추적을 위해 보관해야 합니다.`
          : "등록된 조치 이력이 없으므로 위험 이벤트 발생 여부와 조치 기록을 함께 확인해야 합니다.",
    },
  ];

  const reportTarget = department === "전체" ? "전사" : department;

  const reportPurposeText =
    totalCount === 0
      ? `보고 기간 중 ${reportTarget}의 생성형 AI 이용 위험 이벤트가 탐지되지 않았으며, 현재 운영 현황을 정기적으로 보고하기 위함입니다.`
      : `보고 기간 중 ${reportTarget}의 생성형 AI 이용 과정에서 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 이 중 HIGH 등급은 ${riskCount.high}건입니다. 위험 이벤트 현황과 조치 결과를 검토하고 필요한 후속 대응사항을 보고하기 위함입니다.`;

  const approvalRequestText =
    totalCount === 0
      ? "보고 기간 중 별도의 위험 이벤트가 확인되지 않아 승인 요청사항이 없습니다."
      : riskCount.high > 0 && unresolvedEventCount > 0
      ? `HIGH 등급 위험 이벤트 ${riskCount.high}건과 미완료 조치 ${unresolvedEventCount}건에 대한 후속 대응계획 검토 및 승인을 요청합니다.`
      : riskCount.high > 0
      ? `HIGH 등급 위험 이벤트 ${riskCount.high}건의 조치 결과를 검토하고, 필요 시 추가 통제 강화 여부에 대한 승인을 요청합니다.`
      : unresolvedEventCount > 0
      ? `미완료 위험 이벤트 ${unresolvedEventCount}건에 대한 후속 조치계획 검토 및 승인을 요청합니다.`
      : "보고 기간 중 발생한 위험 이벤트의 조치가 완료되어 결과를 보고합니다.";

  const departmentSummaryText = highestRiskDepartment
    ? `${highestRiskDepartment.department}에서 가장 많은 ${highestRiskDepartment.total}건의 위험 이벤트가 탐지되었습니다.`
    : "";

  const executiveSummaryText =
    totalCount === 0
      ? `보고 기간 중 ${reportTarget}에서 탐지된 위험 이벤트는 없습니다. 현재 기준으로 추가 조치가 필요한 사항은 확인되지 않았습니다.`
      : riskCount.high > 0 && unresolvedEventCount > 0
      ? `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 이 중 HIGH 등급은 ${riskCount.high}건입니다. 현재 미완료 이벤트 ${unresolvedEventCount}건에 대한 후속조치가 필요합니다. ${departmentSummaryText}`
      : riskCount.high > 0
      ? `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 이 중 HIGH 등급은 ${riskCount.high}건입니다. 현재 확인된 조치 완료율은 ${actionCompletionRate}%입니다. ${departmentSummaryText}`
      : unresolvedEventCount > 0
      ? `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었습니다. HIGH 등급 이벤트는 없으나, 미완료 이벤트 ${unresolvedEventCount}건에 대한 확인이 필요합니다. ${departmentSummaryText}`
      : `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 현재 모든 대상 이벤트의 조치가 완료되었습니다. ${departmentSummaryText}`;

  const followUpPlanText =
    totalCount === 0
      ? "보고 기간 중 위험 이벤트가 탐지되지 않아 별도의 후속 조치계획이 없습니다."
      : unresolvedEventCount === 0
      ? `보고 대상 위험 이벤트 ${totalCount}건에 대한 조치가 모두 완료되었습니다. 현재 추가 대응이 필요한 미완료 이벤트는 없습니다.`
      : riskCount.high > 0
      ? `현재 미완료 이벤트 ${unresolvedEventCount}건에 대한 후속 대응이 필요합니다. 특히 HIGH 등급 이벤트 ${riskCount.high}건을 우선 검토하고, 담당 부서의 조치 결과와 재발 방지대책을 확인해야 합니다.`
      : `현재 미완료 이벤트 ${unresolvedEventCount}건에 대한 후속 확인이 필요합니다. 담당 부서별 조치 진행상황을 점검하고 완료 여부를 지속적으로 관리해야 합니다.`;

  const complianceConclusionText =
    totalCount === 0
      ? `보고 기간 중 ${reportTarget}에서 별도의 위험 이벤트가 탐지되지 않았습니다. 현재 생성형 AI 이용 통제 상태에서 특이사항은 확인되지 않았으며, 기존 모니터링과 정기 점검을 지속할 필요가 있습니다.`
      : unresolvedHighCount > 0
      ? `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 이 중 조치가 완료되지 않은 HIGH 등급 이벤트가 ${unresolvedHighCount}건 확인되었습니다. 해당 이벤트를 중점 관리 대상으로 지정하고 담당 부서의 원인 분석, 조치 결과 및 재발 방지대책을 추가로 확인해야 합니다.`
      : unresolvedEventCount > 0
      ? `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 현재 ${unresolvedEventCount}건의 이벤트가 미완료 상태입니다. 중대한 미완료 HIGH 등급 이벤트는 없으나, 조치 진행상황과 최종 완료 여부를 지속적으로 관리해야 합니다.`
      : `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 현재 보고 대상 이벤트에 대한 조치는 모두 완료되었습니다. 향후 동일 유형의 위험이 반복되는지 모니터링하고, 필요 시 관련 정책과 탐지 규칙을 보완해야 합니다.`;

  return {
    totalCount,
    riskCount,
    completedActionEventCount,
    unresolvedEventCount,
    actionCompletionRate,
    affectedDepartmentCount,
    highestRiskDepartment,
    departmentSummaries,
    majorRiskEvents,
    filteredEvents,
    actionHistory,
    actionTypeCount,
    unresolvedHighCount,
    complianceStatus,
    complianceReviewItems,
    reportPurposeText,
    approvalRequestText,
    executiveSummaryText,
    followUpPlanText,
    complianceConclusionText,
    mainDepartmentLimit: MAIN_DEPARTMENT_LIMIT,
    mainEventLimit: MAIN_EVENT_LIMIT,
  };
};

const generateReport = async ({ departmentFilter, periodStart, periodEnd, riskThreshold, reportType, userId }) => {
  const [eventsRes, departments, author] = await Promise.all([
    axios.get(`${process.env.DLP_SERVICE_URL}/events`),
    Department.findAll(),
    userId ? User.findByPk(userId) : Promise.resolve(null),
  ]);

  const events = (eventsRes.data || []).map((event) => ({
    id: event.event_id,
    riskLevel: (event.grade || "LOW").toUpperCase(),
    userName: event.user_name ?? "-",
    department: event.department_name ?? "미지정 부서",
    eventType: formatDetectionType(event.detection_type) || "-",
    // 원문 대신 마스킹본만 스냅샷에 남긴다(영구 저장 데이터라 원문 노출 리스크가 더 큼).
    description: event.masked_description ?? "-",
    createdAt: event.created_at,
    actions: event.actions ?? [],
  }));

  const departmentNames = departments.map((d) => d.name);

  const snapshot = buildReportSnapshot({
    events,
    departmentNames,
    department: departmentFilter,
    periodStart,
    periodEnd,
    riskThreshold,
  });

  const now = new Date();
  const datePrefix = `AI-RISK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const todaysCount = await InternalReport.count({
    where: { document_number: { [Op.like]: `${datePrefix}-%` } },
  });
  const documentNumber = `${datePrefix}-${String(todaysCount + 1).padStart(2, "0")}`;

  let authorDepartmentName = null;
  if (author?.department_id) {
    const dept = await Department.findByPk(author.department_id);
    authorDepartmentName = dept?.name ?? null;
  }

  const row = await InternalReport.create({
    document_number: documentNumber,
    department_filter: departmentFilter,
    period_start: periodStart,
    period_end: periodEnd,
    risk_threshold: riskThreshold,
    report_type: reportType,
    generated_by: userId ?? null,
    generated_by_name: author?.name ?? null,
    generated_by_department: authorDepartmentName,
    snapshot,
  });

  return row;
};

const listReports = async () => {
  return InternalReport.findAll({
    attributes: [
      "id",
      "document_number",
      "department_filter",
      "period_start",
      "period_end",
      "risk_threshold",
      "report_type",
      "generated_by_name",
      "generated_by_department",
      "created_at",
    ],
    order: [["created_at", "DESC"]],
  });
};

const getReportById = async (id) => {
  return InternalReport.findByPk(id);
};

const deleteReport = async (id) => {
  const row = await InternalReport.findByPk(id);
  if (!row) return false;
  await row.destroy();
  return true;
};

module.exports = {
  REPORT_TYPE_LABEL,
  generateReport,
  listReports,
  getReportById,
  deleteReport,
};
