import { useEffect, useMemo, useState } from "react";
import { Printer, ArrowLeft, Trash2, FileText } from "lucide-react";

import { getDepartments } from "../../api/authApi";
import {
  generateInternalReport,
  getInternalReportList,
  getInternalReportById,
  deleteInternalReport,
} from "../../api/internalReportApi";

import "./InternalReportPage.css";

const APPROVAL_ROLES = ["담당", "부장", "사장"];

const RISK_THRESHOLD_OPTIONS = [
  { value: "ALL", label: "전체" },
  { value: "MEDIUM_UP", label: "medium 이상" },
  { value: "HIGH_ONLY", label: "high만" },
];

const REPORT_TYPE_OPTIONS = [
  { value: "REGULAR", label: "정기보고" },
  { value: "AD_HOC", label: "수시보고" },
];

// 본문/별첨에 보여줄 상위 N건 — 백엔드 스냅샷 계산 로직(internalReport.service.js)과 동일한 값으로 유지한다.
const MAIN_DEPARTMENT_LIMIT = 5;
const MAIN_EVENT_LIMIT = 10;
const MAIN_ACTION_LIMIT = 10;

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

function InternalReportPage() {
  const today = useMemo(() => new Date(), []);
  const defaultPeriodStart = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() - 30);
    return toDateInputValue(date);
  }, [today]);
  const defaultPeriodEnd = useMemo(() => toDateInputValue(today), [today]);

  const [viewMode, setViewMode] = useState("list"); // "list" | "detail"

  // 생성 필터
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("전체");
  const [periodStart, setPeriodStart] = useState(defaultPeriodStart);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodEnd);
  const [riskThreshold, setRiskThreshold] = useState("ALL");
  const [reportType, setReportType] = useState("REGULAR");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // 저장된 버전 목록
  const [reports, setReports] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // 열람 중인 버전
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const departmentOptions = useMemo(() => {
    const names = departments.map((d) => d.name);
    return ["전체", ...names];
  }, [departments]);

  const loadReportList = () => {
    setListLoading(true);
    setListError(null);
    getInternalReportList()
      .then((res) => setReports(res.data))
      .catch((err) => {
        console.error("내부결재 보고서 목록 조회 실패", err);
        setListError("보고서 목록을 불러오지 못했습니다.");
      })
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data ?? []))
      .catch((err) => console.error("부서 목록 조회 실패", err));

    loadReportList();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await generateInternalReport({
        departmentFilter: department,
        periodStart,
        periodEnd,
        riskThreshold,
        reportType,
      });
      setSelectedReport(res.data);
      setViewMode("detail");
      loadReportList();
    } catch (err) {
      console.error("내부결재 보고서 생성 실패", err);
      setGenerateError(err.response?.data?.error?.message || "보고서 생성에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenReport = async (id) => {
    setDetailLoading(true);
    setDetailError(null);
    setViewMode("detail");
    try {
      const res = await getInternalReportById(id);
      setSelectedReport(res.data);
    } catch (err) {
      console.error("내부결재 보고서 조회 실패", err);
      setDetailError("보고서를 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("이 보고서를 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.")) return;
    try {
      await deleteInternalReport(id);
      loadReportList();
    } catch (err) {
      console.error("내부결재 보고서 삭제 실패", err);
      alert(err.response?.data?.error?.message || "보고서 삭제에 실패했습니다.");
    }
  };

  const handleBackToList = () => {
    setSelectedReport(null);
    setDetailError(null);
    setViewMode("list");
  };

  if (viewMode === "list") {
    return (
      <div className="internal-report-page">
        <div className="car-toolbar">
          <div>
            <h2>내부결재 보고서</h2>
            <p>생성형 AI 이용 과정에서 탐지된 위험과 조치 현황을 내부결재 문서 형태로 생성·보관합니다.</p>
          </div>
        </div>

        <div className="car-panel car-generate-panel">
          <h3>새 보고서 생성</h3>
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
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                {REPORT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <button type="button" className="car-generate-button" disabled={generating} onClick={handleGenerate}>
              {generating ? "생성 중..." : "생성"}
            </button>
          </div>
          {generateError && <p className="car-error">{generateError}</p>}
        </div>

        <div className="car-panel car-list-panel">
          <h3>생성된 보고서 목록</h3>
          {listLoading && <div className="car-loading">목록을 불러오는 중입니다...</div>}
          {listError && <div className="car-error">{listError}</div>}
          {!listLoading && !listError && (
            reports.length === 0 ? (
              <p className="car-empty-note">아직 생성된 보고서가 없습니다. 위 조건을 정하고 "생성"을 눌러주세요.</p>
            ) : (
              <div className="car-list-table-wrapper">
                <table className="car-list-table">
                  <thead>
                    <tr>
                      <th>문서번호</th>
                      <th>부서</th>
                      <th>보고 기간</th>
                      <th>보고 구분</th>
                      <th>생성일시</th>
                      <th>생성자</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>
                          <button type="button" className="car-list-open-button" onClick={() => handleOpenReport(report.id)}>
                            <FileText size={13} /> {report.document_number}
                          </button>
                        </td>
                        <td>{report.department_filter}</td>
                        <td>{report.period_start} ~ {report.period_end}</td>
                        <td>{REPORT_TYPE_OPTIONS.find((o) => o.value === report.report_type)?.label ?? report.report_type}</td>
                        <td>{formatDateTime(report.created_at)}</td>
                        <td>{report.generated_by_name ?? "-"}</td>
                        <td>
                          <button type="button" className="car-list-delete-button" onClick={() => handleDeleteReport(report.id)}>
                            <Trash2 size={13} /> 삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // ---- 상세(문서) 화면 ----
  return (
    <div className="internal-report-page">
      <div className="car-toolbar">
        <div>
          <h2>내부결재 보고서</h2>
          <p>생성형 AI 이용 과정에서 탐지된 위험과 조치 현황을 내부결재 문서 형태로 확인합니다.</p>
        </div>
        <div className="car-toolbar-actions">
          <button type="button" className="car-back-button" onClick={handleBackToList}>
            <ArrowLeft size={16} /> 목록으로
          </button>
          {selectedReport && (
            <button type="button" className="car-print-button" onClick={() => window.print()}>
              <Printer size={16} /> 인쇄
            </button>
          )}
        </div>
      </div>

      {detailLoading && <div className="car-loading">보고서를 불러오는 중입니다...</div>}
      {detailError && <div className="car-error">{detailError}</div>}

      {!detailLoading && !detailError && selectedReport && (() => {
        const snapshot = selectedReport.snapshot;
        const {
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
          complianceStatus,
          complianceReviewItems,
          reportPurposeText,
          approvalRequestText,
          executiveSummaryText,
          followUpPlanText,
          complianceConclusionText,
        } = snapshot;

        const reportTypeLabel = REPORT_TYPE_OPTIONS.find((o) => o.value === selectedReport.report_type)?.label ?? "정기보고";
        const reportTarget = selectedReport.department_filter === "전체" ? "전사" : selectedReport.department_filter;
        const reportAuthorName = selectedReport.generated_by_name || "-";
        const reportAuthorDepartment = selectedReport.generated_by_department || "미지정 부서";
        const mainDepartmentSummaries = departmentSummaries.filter((row) => row.total > 0).slice(0, MAIN_DEPARTMENT_LIMIT);
        const mainActionHistory = actionHistory.slice(0, MAIN_ACTION_LIMIT);

        return (
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
                      <td>{selectedReport.document_number}</td>

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
                      <td>{formatDate(selectedReport.created_at)}</td>

                      <th>보안등급</th>
                      <td>
                        <strong className="car-security-level">사내한</strong>
                      </td>
                    </tr>

                    <tr>
                      <th>보고 대상</th>
                      <td>{reportTarget}</td>

                      <th>보고 기간</th>
                      <td>{selectedReport.period_start} ~ {selectedReport.period_end}</td>
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
                      {selectedReport.period_start} ~ {selectedReport.period_end}
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
                본 통계는 AI Gateway 로그 기준[{selectedReport.period_start}~{selectedReport.period_end}] 실제 관측 데이터를
                집계한 결과입니다. (생성 시각: {formatDateTime(selectedReport.created_at)})
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

                  {majorRiskEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{event.createdAtDisplay}</td>

                      <td>
                        <span
                          className={`car-risk-badge car-risk-${event.riskLevel.toLowerCase()}`}
                        >
                          {event.riskLevel}
                        </span>
                      </td>

                      <td>
                        <div className="car-user-department">
                          <strong>{event.userName}</strong>
                          <span>{event.department}</span>
                        </div>
                      </td>

                      <td>{event.eventType}</td>

                      <td>
                        <div className="car-event-impact">
                          <strong>{event.description}</strong>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            event.resolved
                              ? "car-status-badge car-status-completed"
                              : "car-status-badge car-status-pending"
                          }
                        >
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                    <th>탐지 내용</th>
                    <th>조치 상태</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="car-empty-row">
                        조건에 해당하는 위험 이벤트가 없습니다.
                      </td>
                    </tr>
                  )}

                  {filteredEvents.map((event, index) => (
                    <tr key={event.id}>
                      <td>{index + 1}</td>
                      <td>{event.createdAtDisplay}</td>

                      <td>
                        <span
                          className={`car-risk-badge car-risk-${event.riskLevel.toLowerCase()}`}
                        >
                          {event.riskLevel}
                        </span>
                      </td>

                        <td>
                          <div className="car-user-department">
                            <strong>{event.userName}</strong>
                            <span>{event.department}</span>
                          </div>
                        </td>

                      <td>{event.eventType}</td>
                      <td>{event.description}</td>

                      <td>
                        <span
                          className={
                            event.resolved
                              ? "car-status-badge car-status-completed"
                              : "car-status-badge car-status-pending"
                          }
                        >
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
        );
      })()}
    </div>
  );
}

export default InternalReportPage;
