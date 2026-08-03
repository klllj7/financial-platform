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
    return filteredEvents.filter((event) => {
      const actions = event.actions || [];

      if (actions.length === 0) {
        return true;
      }

      const latestAction = [...actions].sort((a, b) =>
        new Date(b.action_time || 0).getTime() - new Date(a.action_time || 0).getTime())[0];
      
      return latestAction?.action_type !== "dismissed";
    }).length;
  }, [filteredEvents]);

  const totalCount = filteredEvents.length;

  const reportCreatedAt = useMemo(() => new Date(), []);

  const reportDocumentNumber = useMemo(() => {
    const year = reportCreatedAt.getFullYear();
    const month = String(reportCreatedAt.getMonth() + 1).padStart(2, "0");
    const day = String(reportCreatedAt.getDate()).padStart(2, "0");

    return `AI-RISK-${year}${month}${day}`;
  }, [reportCreatedAt]);

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
      return `High 등급 위험 이벤트 ${riskCount.high}건과 미완료 조치 ${unresolvedEventCount}건에 대한 후속 대응계획 검토 및 승인을 요청합니다.`;
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

            <div className="car-summary-cards">
              <div className="car-summary-card">
                <span className="car-summary-card-label">전체 위험 이벤트</span>
                <strong>{totalCount}건</strong>
              </div>

              <div className="car-summary-card">
                <span className="car-summary-card-label">
                  HIGH / MEDIUM / LOW
                </span>
                <strong>
                  {riskCount.high} / {riskCount.medium} / {riskCount.low}
                </strong>
              </div>

              <div className="car-summary-card">
                <span className="car-summary-card-label">조치 완료 이벤트</span>
                <strong>{completedActionEventCount}건</strong>
              </div>
            </div>
          </section>

          {/* 3. 부서별 위험 탐지 현황 */}
          <section className="car-section">
            <h2>3. 부서별 위험 탐지 현황</h2>

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
                {departmentSummaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="car-empty-row">
                      조건에 해당하는 데이터가 없습니다.
                    </td>
                  </tr>
                )}

                {departmentSummaries.map((row) => (
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
                  <th>사용 모델</th>
                  <th>탐지 내용</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="car-empty-row">
                      조건에 해당하는 위험 이벤트가 없습니다.
                    </td>
                  </tr>
                )}

                {filteredEvents.map((event) => (
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
                    <td>{event.modelName}</td>
                    <td>{event.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 5. 조치 현황 및 후속 계획 */}
          <section className="car-section car-detail-section">
            <h2>5. 조치 현황 및 후속 계획</h2>

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
                {actionHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="car-empty-row">
                      조건에 해당하는 조치 이력이 없습니다.
                    </td>
                  </tr>
                )}

                {actionHistory.map((action) => (
                  <tr key={action.id}>
                    <td>{action.actedAt}</td>
                    <td>
                      {action.eventType} ({action.userName})
                    </td>
                    <td>{action.department}</td>
                    <td>{action.actionLabel}</td>
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

            <ul className="car-policy-notes">
              <li>
                위험등급별 대응 절차는 사내 생성형 AI 사용 정책과 DLP 운영 기준을
                따릅니다.
              </li>
              <li>
                탐지된 위험 이벤트는 관련 정책과 규제 기준에 따라 검토되어야 합니다.
              </li>
              <li>
                본 문서는 내부결재를 위한 위험관리 현황 보고서이며, 공식 규제 제출
                문서와는 구분됩니다.
              </li>
            </ul>
          </section>

          {/* 별첨 */}
          <section className="car-section car-appendix-section">
            <h2>별첨 1. 전체 부서 현황</h2>
            <p className="car-appendix-placeholder">
              전체 부서별 위험 탐지 내역을 제공하는 영역입니다.
            </p>
          </section>

          <section className="car-section car-appendix-section">
            <h2>별첨 2. 전체 위험 이벤트 목록</h2>
            <p className="car-appendix-placeholder">
              보고 기간에 해당하는 전체 위험 이벤트를 제공하는 영역입니다.
            </p>
          </section>

          <section className="car-section car-appendix-section">
            <h2>별첨 3. 전체 조치 이력</h2>
            <p className="car-appendix-placeholder">
              위험 이벤트에 대한 전체 조치 이력을 제공하는 영역입니다.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default InternalReportPage;
