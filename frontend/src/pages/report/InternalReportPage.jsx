import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";

import { getEvents } from "../../api/dlpApi";
import { getDepartments } from "../../api/authApi";
import { formatDetectionType } from "../../utils/detectionType";

import "./InternalReportPage.css";

const APPROVAL_ROLES = ["담당", "부장", "사장"];

const RISK_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2 };

const RISK_THRESHOLD_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "MEDIUM_UP", label: "medium 이상" },
  { value: "HIGH_ONLY", label: "high만" },
];

const ACTION_TYPE_LABEL = {
  reviewed: "모니터링",
  escalated: "조치 중",
  dismissed: "조치 완료",
};

const REPORT_TYPE_OPTIONS = [
  { value: "REGULAR", label: "정기보고" },
  { value: "AD_HOC", label: "수시보고" },
];

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

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("로그인 사용자 정보 파싱 실패", error);
    return null;
  }
}

/* 이벤트의 조치 이력 중 가장 최근 조치를 반환 */
function getLatestAction(actions = []) {
  if (actions.length === 0) {
    return null;
  }

  return [...actions].sort((a, b) =>
    new Date(b.action_time || 0).getTime() - new Date(a.action_time || 0).getTime())[0];
}

/* 최근 조치가 완료(dismissed) 상태인지 확인 */
function isEventResolved(event) {
  const latestAction = getLatestAction(event.actions);

  return latestAction?.action_type === "dismissed";
}

/* 보고서에 표시할 이벤트 조치 상태를 반환 */
function getEventStatus(event) {
  const latestAction = getLatestAction(event.actions);

  if (!latestAction) {
    return "미조치";
  }

  return (
    ACTION_TYPE_LABEL[latestAction.action_type] ?? latestAction.action_type ?? "미확인"
  );
}

function InternalReportPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = useMemo(() => getStoredUser(), []);
  const reportAuthorName = currentUser?.name || "-";

  const reportAuthorDepartment = currentUser?.department?.name || currentUser?.department || "미지정 부서";

  // 이벤트가 0건인 부서도 표에 표시하기 위한 전체 부서 목록 (department 테이블 기준)
  const [departments, setDepartments] = useState([]);

  const today = useMemo(() => new Date(), []);
  const defaultPeriodStart = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return toDateInputValue(date);
  }, [today]);
  const defaultPeriodEnd = useMemo(() => toDateInputValue(today), [today]);

  const [department, setDepartment] = useState("전체");
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd);
  const [riskThreshold, setRiskThreshold] = useState("ALL");
  const [reportType, setReportType] = useState("REGULAR");

  const reportTypeLabel = REPORT_TYPE_OPTIONS.find((option) => option.value === reportType)?.label ?? "정기보고";
  const reportTarget = department === "전체" ? "전사" : department;

  useEffect(() => {
    getEvents()
      .then((res) => {
        const mapped = (res.data || []).map((event) => ({
          id: event.event_id,
          riskLevel: (event.grade || "LOW").toUpperCase(),
          userName: event.user_name ?? "-",
          department: event.department_name ?? "미지정 부서",
          eventType: formatDetectionType(event.detection_type) || "-",
          modelName: event.ai_tool_name ?? "-",
          description: event.description ?? "-",
          createdAt: event.created_at,
          actions: event.actions ?? [],
        }));
        setEvents(mapped);
      })
      .catch((err) => {
        console.error("AI Gateway 로그 조회 실패", err);
        setError("AI Gateway 로그를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));

    // 부서 목록 조회는 위험 이벤트 조회와 무관하므로 실패해도 화면 전체를 막지 않는다.
    getDepartments()
      .then((res) => setDepartments(res.data ?? []))
      .catch((err) => console.error("부서 목록 조회 실패", err));
  }, []);

  const departmentOptions = useMemo(() => {
    const fromDepartments = departments.map((d) => d.name);
    const fromEvents = events.map((e) => e.department);
    const unique = Array.from(new Set([...fromDepartments, ...fromEvents])).sort();
    return ["전체", ...unique];
  }, [departments, events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = event.createdAt ? formatDate(event.createdAt) : null;
      const inPeriod = !eventDate || (eventDate >= periodStart && eventDate <= periodEnd);
      const inDepartment = department === "전체" || event.department === department;

      const riskRank = RISK_ORDER[event.riskLevel] ?? 0;
      const meetsRisk =
        riskThreshold === "ALL" ||
        (riskThreshold === "MEDIUM_UP" && riskRank >= RISK_ORDER.MEDIUM) ||
        (riskThreshold === "HIGH_ONLY" && riskRank === RISK_ORDER.HIGH);

      return inPeriod && inDepartment && meetsRisk;
    });
  }, [events, department, periodStart, periodEnd, riskThreshold]);

  const riskCount = useMemo(() => {
    return filteredEvents.reduce(
      (acc, event) => {
        const key = event.riskLevel.toLowerCase();
        if (acc[key] !== undefined) acc[key] += 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 }
    );
  }, [filteredEvents]);

  const departmentSummaries = useMemo(() => {
    const buckets = new Map();

    /*
      부서 필터를 "전체"로 두면 department 테이블의 전체 부서를 0건으로 먼저 채워 넣는다.
      (departments 조회가 실패했거나 아직 안 왔으면, 기존처럼 이벤트에 등장한 부서만이라도
      보여준다.)
      특정 부서를 선택했다면 그 부서 하나만 기준으로 삼는다 — 안 그러면 필터링 의미가 없어진다.
    */
    const baseDepartments =
      department !== "전체"
        ? [department]
        : departments.length > 0
          ? departments.map((d) => d.name)
          : Array.from(new Set(events.map((e) => e.department)));

    baseDepartments.forEach((name) => {
      buckets.set(name, { department: name, high: 0, medium: 0, low: 0 });
    });

    filteredEvents.forEach((event) => {
      const current = buckets.get(event.department) ?? {
        department: event.department,
        high: 0,
        medium: 0,
        low: 0,
      };
      const key = event.riskLevel.toLowerCase();
      if (current[key] !== undefined) current[key] += 1;
      buckets.set(event.department, current);
    });

    return [...buckets.values()]
      .map((row) => ({ ...row, total: row.high + row.medium + row.low }))
      .sort((a, b) => b.total - a.total);
  }, [departments, events, department, filteredEvents]);

  const actionHistory = useMemo(() => {
    return filteredEvents
      .flatMap((event) =>
        (event.actions || []).map((action, index) => ({
          id: `${event.id}-${index}`,
          department: event.department,
          userName: event.userName,
          eventType: event.eventType,

          actionType: action.action_type ?? "",

          actionLabel: ACTION_TYPE_LABEL[action.action_type] ?? action.action_type ?? "-",
          // DLP /events 응답의 actions[]는 이름이 아니라 actor_user_id(숫자)만 내려준다.
          // 이름으로 보여주려면 별도 사용자 조회가 필요해 우선 ID를 그대로 표시한다.
          actorName: action.actor_user_id ?? "-",
          reason: action.action_reason ?? "-",
          actedAt: formatDateTime(action.action_time),
          actedAtRaw: action.action_time ?? "",
        }))
      )
      .sort((a, b) => (a.actedAtRaw < b.actedAtRaw ? 1 : -1));
  }, [filteredEvents]);

  const completedActionEventCount = filteredEvents.filter((event) =>
    (event.actions || []).some((a) => a.action_type === "dismissed")
  ).length;

  const unresolvedEventCount = useMemo(() => {
    // 최근 조치가 완료 상태가 아닌 이벤트만 미완료로 집계
    return filteredEvents.filter((event) => !isEventResolved(event)).length;
  }, [filteredEvents]);

  const totalCount = filteredEvents.length;

  // 조치 완료율 계산하기
  const actionCompletionRate = useMemo(() => {
    if (totalCount === 0) {
      return 0;
    }

    return Math.round((completedActionEventCount / totalCount) * 100);
  }, [completedActionEventCount, totalCount]);

  // 위험 발생 부서 수 계산하기
  const affectedDepartmentCount = useMemo(() => {
    return new Set(filteredEvents.map((event) => event.department)).size;
  }, [filteredEvents]);

  // 가장 위험 이벤트가 많은 부서 계산하기
  const highestRiskDepartment = useMemo(() => {
    const departmentsWithEvents = departmentSummaries.filter((row) => row.total > 0);

    return departmentsWithEvents[0] ?? null;
  }, [departmentSummaries]);

  // 본문용 상위 부서 데이터 만들기
  const MAIN_DEPARTMENT_LIMIT = 5;

  const mainDepartmentSummaries = useMemo(() => {
    return departmentSummaries.filter((row) => row.total > 0).slice(0, MAIN_DEPARTMENT_LIMIT);
  }, [departmentSummaries]);

  // 주요 위험 이벤트 데이터 만들기
  const MAIN_EVENT_LIMIT = 10;

  const majorRiskEvents = useMemo(() => {
    /*
     * 본문에는 결재자가 먼저 확인해야 할 이벤트만 표시
     *
     * 정렬 우선순위:
     * 1. HIGH 등급
     * 2. 미완료 상태
     * 3. 위험등급이 높은 이벤트
     * 4. 최근 발생 이벤트
     */
    return [...filteredEvents].sort((a, b) => {
      const aIsHigh = a.riskLevel === "HIGH" ? 1 : 0;
      const bIsHigh = b.riskLevel === "HIGH" ? 1 : 0;

      if (aIsHigh !== bIsHigh) {
        return bIsHigh - aIsHigh;
      }

      const aIsUnresolved = isEventResolved(a) ? 0 : 1;
      const bIsUnresolved = isEventResolved(b) ? 0 : 1;

      if (aIsUnresolved !== bIsUnresolved) {
        return bIsUnresolved - aIsUnresolved;
      }

      const riskDifference = (RISK_ORDER[b.riskLevel] ?? 0) - (RISK_ORDER[a.riskLevel] ?? 0);

      if (riskDifference !== 0) {
        return riskDifference;
      }

      return (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }).slice(0, MAIN_EVENT_LIMIT);
  }, [filteredEvents]);

  // 주요 조치 이력 만들기
  const MAIN_ACTION_LIMIT = 10;

  const mainActionHistory = useMemo(() => {
    return actionHistory.slice(0, MAIN_ACTION_LIMIT);
  }, [actionHistory]);

  // 조치 유형별 건수 계산하기
  const actionTypeCount = useMemo(() => {
    return actionHistory.reduce((acc, action) => {
      const actionType = action.actionType;

      if (actionType === "reviewed") {
        acc.reviewed += 1;
      } else if (actionType === "escalated") {
        acc.escalated += 1;
      } else if (actionType === "dismissed") {
        acc.dismissed += 1;
      }

      return acc;
    }, 
    {
      reviewed: 0,
      escalated: 0,
      dismissed: 0,
    });
  }, [actionHistory]);

  // 조치가 완료되지 않은 HIGH 등급 이벤트 수
  const unresolvedHighCount = useMemo(() => {
    return filteredEvents.filter((event) =>
      event.riskLevel === "HIGH" && !isEventResolved(event)
    ).length;
  }, [filteredEvents]);

  const reportCreatedAt = useMemo(() => new Date(), []);

  const reportDocumentNumber = useMemo(() => {
    const year = reportCreatedAt.getFullYear();
    const month = String(reportCreatedAt.getMonth() + 1).padStart(2, "0");
    const day = String(reportCreatedAt.getDate()).padStart(2, "0");

    return `AI-RISK-${year}${month}${day}`;
  }, [reportCreatedAt]);

  // 위험 이벤트와 조치 상태를 기준으로 내부 준수 검토 결과를 계산함
  const complianceStatus = useMemo(() => {
    if (totalCount === 0) {
      return {
        code: "NORMAL",
        label: "특이사항 없음",
      };
    }

    // HIGH 등급이면서 아직 조치가 끝나지 않은 이벤트가 있으면 가장 높은 주의 단계로 판단
    if (unresolvedHighCount > 0) {
      return {
        code: "REVIEW_REQUIRED",
        label: "중점 검토 필요",
      };
    }

    if (unresolvedEventCount > 0) {
      return {
        code: "FOLLOW_UP_REQUIRED",
        label: "후속 조치 필요",
      };
    }

    return {
      code: "MANAGED",
      label: "조치 완료",
    };
  }, [totalCount, unresolvedHighCount, unresolvedEventCount]);

  // 보고서에 표시할 정책·규제 준수 검토 항목
  const complianceReviewItems = useMemo(() => {
    return [
      {
        id: "policy",
        category: "내부 정책 준수",
        status:
          totalCount === 0
            ? "특이사항 없음"
            : `${totalCount}건 탐지`,
        opinion:
          totalCount === 0
            ? "보고 기간 중 내부 정책 위반 의심 이벤트가 탐지되지 않았습니다."
            : "탐지된 이벤트는 사내 생성형 AI 사용 정책과 DLP 운영 기준에 따라 검토가 필요합니다.",
      },
      {
        id: "high-risk",
        category: "중대 위험 검토",
        status:
          unresolvedHighCount > 0
            ? `${unresolvedHighCount}건 미완료`
            : "미완료 없음",
        opinion:
          unresolvedHighCount > 0
            ? "미완료 HIGH 등급 이벤트를 우선 검토하고 담당 부서의 조치 결과를 확인해야 합니다."
            : "현재 미완료 상태의 HIGH 등급 이벤트는 확인되지 않았습니다.",
      },
      {
        id: "action",
        category: "조치 이행 상태",
        status:
          unresolvedEventCount > 0
            ? `${unresolvedEventCount}건 미완료`
            : "조치 완료",
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
  }, [
    totalCount,
    unresolvedHighCount,
    unresolvedEventCount,
    actionHistory.length,
  ]);

  // 보고 목적 문구
  const reportPurposeText = useMemo(() => {
    if (totalCount === 0) {
      return `보고 기간 중 ${reportTarget}의 생성형 AI 이용 위험 이벤트가 탐지되지 않았으며,
      현재 운영 현황을 정기적으로 보고하기 위함입니다.`;
    }

    return `보고 기간 중 ${reportTarget}의 생성형 AI 이용 과정에서 총 ${totalCount}건의 위험 이벤트가 탐지되었으며, 
    이 중 HIGH 등급은 ${riskCount.high}건입니다.
    위험 이벤트 현황과 조치 결과를 검토하고 필요한 후속 대응사항을 보고하기 위함입니다.`;
  }, [reportTarget, totalCount, riskCount.high]);

  // 결재 요청사항 문구
  const approvalRequestText = useMemo(() => {
    if (totalCount === 0) {
      return "보고 기간 중 별도의 위험 이벤트가 확인되지 않아 승인 요청사항이 없습니다.";
    }

    if (riskCount.high > 0 && unresolvedEventCount > 0) {
      return `HIGH 등급 위험 이벤트 ${riskCount.high}건과 미완료 조치 ${unresolvedEventCount}건에 대한 후속 대응계획 검토 및 승인을 요청합니다.`;
    }

    if (riskCount.high > 0) {
      return `HIGH 등급 위험 이벤트 ${riskCount.high}건의 조치 결과를 검토하고,
      필요 시 추가 통제 강화 여부에 대한 승인을 요청합니다.`;
    }

    if (unresolvedEventCount > 0) {
      return `미완료 위험 이벤트 ${unresolvedEventCount}건에 대한 후속 조치계획 검토 및 승인을 요청합니다.`;
    }

    return "보고 기간 중 발생한 위험 이벤트의 조치가 완료되어 결과를 보고합니다.";
  }, [totalCount, riskCount.high, unresolvedEventCount]);

  // 경영 요약 문장 만들기
  const executiveSummaryText = useMemo(() => {
    if (totalCount === 0) {
      return `보고 기간 중 ${reportTarget}에서 탐지된 위험 이벤트는 없습니다.
      현재 기준으로 추가 조치가 필요한 사항은 확인되지 않았습니다.`;
    }

    const departmentSummary = highestRiskDepartment 
      ? `${highestRiskDepartment.department}에서 가장 많은 ${highestRiskDepartment.total}건의 위험 이벤트가 탐지되었습니다.`
      : "";

    if (riskCount.high > 0 && unresolvedEventCount > 0) {
      return `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며,
      이 중 HIGH 등급은 ${riskCount.high}건입니다.
      현재 미완료 이벤트 ${unresolvedEventCount}건에 대한 후속조치가 필요합니다.
      ${departmentSummary}`;
    }

    if (riskCount.high > 0) {
      return `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며,
      이 중 HIGH 등급은 ${riskCount.high}건입니다.
      현재 확인된 조치 완료율은 ${actionCompletionRate}%입니다.
      ${departmentSummary}`;
    }

    if (unresolvedEventCount > 0) {
      return `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었습니다.
      HIGH 등급 이벤트는 없으나, 미완료 이벤트 ${unresolvedEventCount}건에 대한 확인이 필요합니다.
      ${departmentSummary}`;
    }

    return `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며,
    현재 모든 대상 이벤트의 조치가 완료되었습니다.
    ${departmentSummary}`;
  }, [totalCount, reportTarget, highestRiskDepartment, riskCount.high, unresolvedEventCount, actionCompletionRate, ]);

  const followUpPlanText = useMemo(() => {
    if (totalCount === 0) {
      return "보고 기간 중 위험 이벤트가 탐지되지 않아 별도의 후속 조치계획이 없습니다.";
    }

    if (unresolvedEventCount === 0) {
      return `보고 대상 위험 이벤트 ${totalCount}건에 대한 조치가 모두 완료되었습니다.
      현재 추가 대응이 필요한 미완료 이벤트는 없습니다.`;
    }

    if (riskCount.high > 0) {
      return `현재 미완료 이벤트 ${unresolvedEventCount}건에 대한 후속 대응이 필요합니다.
      특히 HIGH 등급 이벤트 ${riskCount.high}건을 우선 검토하고, 
      담당 부서의 조치 결과와 재발 방지대책을 확인해야 합니다.`;
    }

    return `현재 미완료 이벤트 ${unresolvedEventCount}건에 대한 후속 확인이 필요합니다.
    담당 부서별 조치 진행상황을 점검하고 완료 여부를 지속적으로 관리해야 합니다.`;
  }, [totalCount, unresolvedEventCount, riskCount.high]);

  // 현재 위험 수준과 조치 상태에 따라 보고서 종합 의견을 생성한다.
  const complianceConclusionText = useMemo(() => {
    if (totalCount === 0) {
      return `보고 기간 중 ${reportTarget}에서 별도의 위험 이벤트가 탐지되지 않았습니다.
  현재 생성형 AI 이용 통제 상태에서 특이사항은 확인되지 않았으며,
  기존 모니터링과 정기 점검을 지속할 필요가 있습니다.`;
    }

    if (unresolvedHighCount > 0) {
      return `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며,
  이 중 조치가 완료되지 않은 HIGH 등급 이벤트가 ${unresolvedHighCount}건 확인되었습니다.
  해당 이벤트를 중점 관리 대상으로 지정하고 담당 부서의 원인 분석,
  조치 결과 및 재발 방지대책을 추가로 확인해야 합니다.`;
    }

    if (unresolvedEventCount > 0) {
      return `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며,
  현재 ${unresolvedEventCount}건의 이벤트가 미완료 상태입니다.
  중대한 미완료 HIGH 등급 이벤트는 없으나,
  조치 진행상황과 최종 완료 여부를 지속적으로 관리해야 합니다.`;
    }

    return `보고 기간 중 총 ${totalCount}건의 위험 이벤트가 탐지되었으며,
  현재 보고 대상 이벤트에 대한 조치는 모두 완료되었습니다.
  향후 동일 유형의 위험이 반복되는지 모니터링하고,
  필요 시 관련 정책과 탐지 규칙을 보완해야 합니다.`;
  }, [
    totalCount,
    reportTarget,
    unresolvedHighCount,
    unresolvedEventCount,
  ]);

  return (
    <div className="internal-report-page">
      {/* 화면 전용 툴바 (인쇄시 숨김) */}
      <div className="car-toolbar">
        <div>
          <h2>내부결재 보고서</h2>
          <p>생성형 AI 이용 과정에서 탐지된 위험과 조치 현황을 내부결재 문서 형태로 확인합니다.</p>
        </div>
        <button type="button" className="car-print-button" onClick={() => window.print()}>
          <Printer size={16} /> 인쇄
        </button>
      </div>

      {/* 화면 전용 필터 (인쇄시 숨김) */}
      <div className="car-filter-bar">
        <label className="car-filter-field">
          <span>부서</span>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label className="car-filter-field">
          <span>기간 시작</span>
          <input
            type="date"
            value={periodStart}
            max={periodEnd}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </label>

        <label className="car-filter-field">
          <span>기간 종료</span>
          <input
            type="date"
            value={periodEnd}
            min={periodStart}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </label>

        <label className="car-filter-field">
          <span>위험등급 최소 기준</span>
          <select value={riskThreshold} onChange={(e) => setRiskThreshold(e.target.value)}>
            {RISK_THRESHOLD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label className="car-filter-field">
          <span>보고 구분</span>

          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
          >
            {REPORT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <div className="car-loading">AI Gateway 로그를 불러오는 중입니다...</div>}
      {error && <div className="car-error">{error}</div>}

      {!loading && !error && (
        <div className="car-document">
          <header className="car-document-header">
            <div className="car-document-heading">
              <p className="car-document-category">내부결재 보고서</p>
              <h1>생성형 AI 이용 위험관리 현황 및 조치 결과 보고</h1>
            </div>

            <div className="car-document-info-layout">
              <table className="car-document-info-table">
                <tbody>
                  <tr>
                    <th>문서번호</th>
                    <td>{reportDocumentNumber}</td>

                    <th>보고 구분</th>
                    <td>{reportTypeLabel}</td>
                  </tr>

                  <tr>
                    <th>작성자</th>
                    <td>{reportAuthorName}</td>

                    <th>작성 부서</th>
                    <td>{reportAuthorDepartment}</td>
                  </tr>

                  <tr>
                    <th>작성일</th>
                    <td>{formatDate(reportCreatedAt)}</td>

                    <th>보안등급</th>
                    <td>
                      <strong className="car-security-level">사내한</strong>
                    </td>
                  </tr>

                  <tr>
                    <th>보고 대상</th>
                    <td>{reportTarget}</td>

                    <th>보고 기간</th>
                    <td>{periodStart} ~ {periodEnd}</td>
                  </tr>
                </tbody>
              </table>

              <div className="car-approval-line">
                {APPROVAL_ROLES.map((role) => (
                  <div key={role} className="car-approval-box">
                    <div className="car-approval-role">{role}</div>

                    <div className="car-approval-space">
                      <span>서명</span>
                    </div>

                    <div className="car-approval-date">
                      날짜
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {/* 1. 보고 개요 및 결재 요청사항 */}
          <section className="car-section">
            <h2>1. 보고 개요 및 결재 요청사항</h2>

            <table className="car-overview-table">
              <tbody>
                <tr>
                  <th>보고 목적</th>
                  <td className="car-overview-description">
                    {reportPurposeText}
                  </td>
                </tr>
                <tr>
                  <th>보고 대상</th>
                  <td>{reportTarget}</td>
                </tr>
                <tr>
                  <th>보고 기간</th>
                  <td>
                    {periodStart} ~ {periodEnd}
                  </td>
                </tr>
                <tr>
                  <th>결재 요청사항</th>
                  <td className="car-overview-description">
                    {approvalRequestText}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 2. 경영 요약 */}
          <section className="car-section">
            <h2>2. 경영 요약</h2>

            <p className="car-source-note">
              본 통계는 AI Gateway 로그 기준[{periodStart}~{periodEnd}] 실제 관측 데이터를
              집계한 결과입니다. (작성 시각: {formatDateTime(new Date().toISOString())})
            </p>

            <div className="car-summary-cards car-summary-cards-five">
              <div className="car-summary-card">
                <span className="car-summary-card-label">전체 위험 이벤트</span>
                <strong>{totalCount}건</strong>
                <small>
                  HIGH {riskCount.high} · MEDIUM {riskCount.medium} · LOW{" "}
                  {riskCount.low}
                </small>
              </div>

              <div className="car-summary-card car-summary-card-high">
                <span className="car-summary-card-label">
                  HIGH 위험 이벤트
                </span>
                <strong>{riskCount.high}건</strong>
                <small>우선 검토 대상</small>
              </div>

              <div className="car-summary-card car-summary-card-unresolved">
                <span className="car-summary-card-label">
                  미완료 이벤트
                </span>
                <strong>{unresolvedEventCount}건</strong>
                <small>후속조치 필요</small>
              </div>

              <div className="car-summary-card">
                <span className="car-summary-card-label">조치 완료율</span>
                <strong>{actionCompletionRate}%</strong>
                <small>
                  완료 {completedActionEventCount}건
                </small>
              </div>

              <div className="car-summary-card">
                <span className="car-summary-card-label">
                  위험 발생 부서
                </span>
                <strong>{affectedDepartmentCount}개</strong>
                <small>
                  {highestRiskDepartment
                    ? `최다 ${highestRiskDepartment.department}`
                    : "발생 부서 없음"}
                </small>
              </div>
            </div>

            <div className="car-executive-summary">
              <h3>종합 요약</h3>
              <p>{executiveSummaryText}</p>
            </div>
          </section>

          {/* 3. 부서별 위험 탐지 현황 */}
          <section className="car-section">
            <h2>3. 부서별 위험 탐지 현황</h2>
            
            <p className="car-section-description">
              위험 이벤트 발생 건수를 기준으로 상위 최대 {MAIN_DEPARTMENT_LIMIT}개 부서를 표시합니다.
              전체 부서 현황은 별첨 1에서 확인할 수 있습니다.
            </p>
            <table className="car-summary-table">
              <thead>
                <tr>
                  <th>부서</th>
                  <th>HIGH</th>
                  <th>MEDIUM</th>
                  <th>LOW</th>
                  <th>합계</th>
                </tr>
              </thead>

              <tbody>
                {mainDepartmentSummaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="car-empty-row">
                      조건에 해당하는 위험 이벤트가 없습니다.
                    </td>
                  </tr>
                )}

                {mainDepartmentSummaries.map((row) => (
                  <tr key={row.department}>
                    <td>{row.department}</td>
                    <td>{row.high}</td>
                    <td>{row.medium}</td>
                    <td>{row.low}</td>
                    <td>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 4. 주요 위험 이벤트 및 영향 분석 */}
          <section className="car-section car-detail-section">
            <h2>4. 주요 위험 이벤트 및 영향 분석</h2>

            <p className="car-section-description">
              HIGH 등급과 미완료 이벤트를 우선으로 최대 {MAIN_EVENT_LIMIT}건을 표시합니다.
              전체 위험 이벤트는 별첨 2에서 확인할 수 있습니다.
            </p>

            <div className="car-risk-criteria">
              <strong>위험 등급 산출 기준</strong>

              <ul>
                <li>
                  HIGH: 고유식별정보·금융거래정보 등 민감정보 직접 노출 또는
                  정책 위반이 명확한 경우
                </li>
                <li>
                  MEDIUM: 정책 우회 시도, 비정상 접근 패턴 등 추가 확인이 필요한 경우
                </li>
                <li>
                  LOW: 경미한 규칙 위반 또는 모니터링 목적의 참고성 탐지
                </li>
              </ul>

              <small>
                ※ 실제 등급은 DLP 탐지 규칙 설정값에 따라 결정됩니다.
              </small>
            </div>

            <table className="car-detail-table">
              <thead>
                <tr>
                  <th>발생 시각</th>
                  <th>위험등급</th>
                  <th>사용자 / 부서</th>
                  <th>탐지 유형</th>
                  <th>탐지 내용 및 영향</th>
                  <th>조치 상태</th>
                </tr>
              </thead>

              <tbody>
                {majorRiskEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="car-empty-row">
                      조건에 해당하는 위험 이벤트가 없습니다.
                    </td>
                  </tr>
                )}

                {majorRiskEvents.map((event) => {
                  const eventResolved = isEventResolved(event);

                  return (
                    <tr key={event.id}>
                      <td>{formatDateTime(event.createdAt)}</td>

                      <td>
                        <span
                          className={`car-risk-badge car-risk-${event.riskLevel.toLowerCase()}`}
                        >
                          {event.riskLevel}
                        </span>
                      </td>

                      <td>
                        {event.userName} / {event.department}
                      </td>

                      <td>{event.eventType}</td>

                      <td>
                        <div className="car-event-impact">
                          <strong>{event.description}</strong>
                          <small>
                            사용 모델: {event.modelName}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span 
                          className={
                            eventResolved 
                              ? "car-status-badge car-status-completed" 
                              : "car-status-badge car-status-pending"
                          }
                        >
                          {getEventStatus(event)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* 5. 조치 현황 및 후속 계획 */}
          <section className="car-section car-detail-section">
            <h2>5. 조치 현황 및 후속 계획</h2>

            <p className="car-section-description">
              최근 수행된 주요 조치 최대 {MAIN_ACTION_LIMIT}건을 표시합니다.
              전체 조치 이력은 별첨 3에서 확인할 수 있습니다.
            </p>

            <div className="car-action-summary">
              <div className="car-action-summary-item">
                <span>모니터링</span>
                <strong>{actionTypeCount.reviewed}건</strong>
              </div>

              <div className="car-action-summary-item">
                <span>조치 중</span>
                <strong>{actionTypeCount.escalated}건</strong>
              </div>

              <div className="car-action-summary-item">
                <span>조치 완료</span>
                <strong>{actionTypeCount.dismissed}건</strong>
              </div>

              <div className="car-action-summary-item">
                <span>미완료 이벤트</span>
                <strong>{unresolvedEventCount}건</strong>
              </div>
            </div>

            <div className="car-follow-up-plan">
              <h3>후속 계획</h3>
              <p>{followUpPlanText}</p>
            </div>

            <table className="car-detail-table">
              <thead>
                <tr>
                  <th>조치 일시</th>
                  <th>대상 이벤트</th>
                  <th>부서</th>
                  <th>조치 유형</th>
                  <th>조치자</th>
                  <th>조치 사유</th>
                </tr>
              </thead>

              <tbody>
                {mainActionHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="car-empty-row">
                      조건에 해당하는 조치 이력이 없습니다.
                    </td>
                  </tr>
                )}

                {mainActionHistory.map((action) => (
                  <tr key={action.id}>
                    <td>{action.actedAt}</td>
                    <td>
                      {action.eventType} ({action.userName})
                    </td>
                    <td>{action.department}</td>
                    <td>
                      <span 
                        className={`car-action-badge car-action-${action.actionType || "unknown"}`}
                      >
                        {action.actionLabel}
                      </span>
                    </td>
                    <td>{action.actorName}</td>
                    <td>{action.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 6. 정책·규제 준수 검토 및 종합 의견 */}
          <section className="car-section">
            <h2>6. 정책·규제 준수 검토 및 종합 의견</h2>

            <p className="car-section-description">
              본 검토 결과는 보고 기간 중 수집된 AI Gateway 로그와 조치 이력을 기준으로 작성한 내부 위험관리 관점의 판단입니다.
            </p>

            <div className="car-compliance-status">
              <span>종합 검토 상태</span>
              <strong
                className={`car-compliance-status-value car-compliance-${complianceStatus.code.toLowerCase()}`}
              >
                {complianceStatus.label}
              </strong>
            </div>

            <table className="car-compliance-table">
              <thead>
                <tr>
                  <th>검토 항목</th>
                  <th>검토 결과</th>
                  <th>검토 의견</th>
                </tr>
              </thead>

              <tbody>
                {complianceReviewItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.category}</td>
                    <td>{item.status}</td>
                    <td>{item.opinion}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="car-compliance-conclusion">
              <h3>종합 의견</h3>
              <p>{complianceConclusionText}</p>
            </div>

            <p className="car-compliance-notice">
              ※ 본 결과는 내부 위험관리 및 결재를 위한 검토 의견이며,
              법률적 판단 또는 감독기관의 공식 유권해석을 의미하지 않습니다.
            </p>
          </section>

          {/* 별첨 */}
          <section className="car-section car-appendix-section">
            <h2>별첨 1. 전체 부서 현황</h2>
            <p className="car-section-description">
              보고 대상과 조회 조건에 해당하는 전체 부서별 위험 탐지 현황입니다.
            </p>

            <table className="car-summary-table">
              <thead>
                <tr>
                  <th>순위</th>
                  <th>부서</th>
                  <th>HIGH</th>
                  <th>MEDIUM</th>
                  <th>LOW</th>
                  <th>합계</th>
                </tr>
              </thead>

              <tbody>
                {departmentSummaries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="car-empty-row">
                      조건에 해당하는 부서 데이터가 없습니다.
                    </td>
                  </tr>
                )}

                {departmentSummaries.map((row, index) => (
                  <tr key={row.department}>
                    <td>{index + 1}</td>
                    <td>{row.department}</td>
                    <td>{row.high}</td>
                    <td>{row.medium}</td>
                    <td>{row.low}</td>
                    <td>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="car-section car-appendix-section">
            <h2>별첨 2. 전체 위험 이벤트 목록</h2>
            <p className="car-section-description">
              현재 보고 조건에 해당하는 전체 위험 이벤트 목록입니다.
            </p>

            <table className="car-detail-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>발생 시각</th>
                  <th>위험등급</th>
                  <th>사용자 / 부서</th>
                  <th>탐지 유형</th>
                  <th>사용 모델</th>
                  <th>탐지 내용</th>
                  <th>조치 상태</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="car-empty-row">
                      조건에 해당하는 위험 이벤트가 없습니다.
                    </td>
                  </tr>
                )}

                {filteredEvents.map((event, index) => {
                  const eventResolved = isEventResolved(event);

                  return (
                    <tr key={event.id}>
                      <td>{index + 1}</td>
                      <td>{formatDateTime(event.createdAt)}</td>

                      <td>
                        <span 
                          className={`car-risk-badge car-risk-${event.riskLevel.toLowerCase()}`}
                        >
                          {event.riskLevel}
                        </span>
                      </td>

                      <td>
                        {event.userName} / {event.department}
                      </td>

                      <td>{event.eventType}</td>
                      <td>{event.modelName}</td>
                      <td>{event.description}</td>

                      <td>
                        <span
                          className={
                            eventResolved
                              ? "car-status-badge car-status-completed"
                              : "car-status-badge car-status-pending"
                          }
                        >
                          {getEventStatus(event)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className="car-section car-appendix-section">
            <h2>별첨 3. 전체 조치 이력</h2>
            <p className="car-section-description">
              현재 보고 조건에 해당하는 위험 이벤트의 전체 조치 이력입니다.
            </p>

            <table className="car-detail-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>조치 일시</th>
                  <th>대상 이벤트</th>
                  <th>부서</th>
                  <th>조치 유형</th>
                  <th>조치자</th>
                  <th>조치 사유</th>
                </tr>
              </thead>

              <tbody>
                {actionHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="car-empty-row">
                      조건에 해당하는 조치 이력이 없습니다.
                    </td>
                  </tr>
                )}

                {actionHistory.map((action, index) => (
                  <tr key={action.id}>
                    <td>{index + 1}</td>
                    <td>{action.actedAt}</td>

                    <td>
                      {action.eventType} ({action.userName})
                    </td>

                    <td>{action.department}</td>

                    <td>
                      <span
                        className={`car-action-badge car-action-${action.actionType || "unknown"}`}
                      >
                        {action.actionLabel}
                      </span>
                    </td>

                    <td>{action.actorName}</td>
                    <td>{action.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}

export default InternalReportPage;
