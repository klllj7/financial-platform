import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* 전사 대시보드에 표시할 아이콘 */
import {
  ArrowRight,
  Bell,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileCheck2,
} from "lucide-react";

/* 컴포넌트 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* 최근 공지와 위험 이벤트를 각각의 백엔드에서 조회한다. */
import { getNotices } from "../../../api/noticeApi";
import { getEvents } from "../../../api/dlpApi";
import { formatDetectionType } from "../../../utils/detectionType";
import { getEvidenceSummary } from "../../../api/reportApi";
import { getPolicies } from "../../../api/policyApi";
import { getAiToolApplications } from "../../../api/aiToolApi";
import {
  getComplianceDashboardSummary,
  getComplianceDashboardTrend,
} from "../../../api/dashboardApi";
import { markNoticeAsRead } from "../../../utils/noticeReadState";

/*
  전사 대시보드 전용 CSS
*/
import "./ComplianceDashboardPage.css";


/*
  숫자에 천 단위 쉼표를 추가한다.

  예:
  1284000
  → 1,284,000
*/
const formatNumber = (value) => {
  return new Intl.NumberFormat("ko-KR").format(value);
};

const EMPTY_SUMMARY = {
  totalTokens: 0,
  estimatedCostKrw: 0,
};

const EMPTY_RISK_SUMMARY = {
  high: 0,
  medium: 0,
  low: 0,
  urgentActionCount: 0,
};

const EMPTY_EVIDENCE_SUMMARY = {
  preparedCount: 0,
  totalCount: 38,
  overallPercentage: 0,
  categories: [
    {
      key: "관리적",
      label: "⑦ 관리적 보호조치",
      preparedCount: 0,
      totalCount: 17,
      percentage: 0,
    },
    {
      key: "기술적",
      label: "⑧ 기술적 보호조치",
      preparedCount: 0,
      totalCount: 11,
      percentage: 0,
    },
    {
      key: "처리위탁",
      label: "⑥ 처리위탁",
      preparedCount: 0,
      totalCount: 7,
      percentage: 0,
    },
    {
      key: "수집",
      label: "② 수집",
      preparedCount: 0,
      totalCount: 2,
      percentage: 0,
    },
    {
      key: "제공",
      label: "③ 제공",
      preparedCount: 0,
      totalCount: 1,
      percentage: 0,
    },
  ],
};

const REQUEST_STATUS_LABELS = {
  pending: "검토 중",
  approved: "승인 완료",
  rejected: "반려",
  PENDING: "검토 중",
  APPROVED: "승인 완료",
  REJECTED: "반려",
};

/* DLP의 조치 이력 중 가장 최근 수동 조치를 화면 상태로 변환한다. */
const getActionStatus = (actions = []) => {
  const statusMap = {
    reviewed: { label: "모니터링", type: "monitoring" },
    escalated: { label: "조치 중", type: "processing" },
    dismissed: { label: "조치 완료", type: "completed" },
  };
  const manualActions = actions.filter((action) =>
    Object.hasOwn(statusMap, action.action_type),
  );
  const latestAction = manualActions.at(-1);

  return latestAction
    ? statusMap[latestAction.action_type]
    : { label: "미조치", type: "none" };
};

/* DLP 이벤트의 발생 시간을 대시보드용 날짜 형식으로 표시한다. */
const formatOccurredAt = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateInputValue = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

const TODAY_DATE_INPUT = formatDateInputValue(new Date());
// 부서별 위험 이벤트 그래프: 부서 하나당 차지하는 너비를 고정해서, 부서가
// 늘어나도 막대가 찌그러지지 않고 가로 스크롤로 대응하게 한다.
const DEPARTMENT_CHART_SLOT_WIDTH = 96;
const DEPARTMENT_CHART_MIN_WIDTH = 480;
const USAGE_MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  return {
    value,
    label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
  };
});

function ComplianceDashboardPage({ isAdminView = false }) {
  /*
    다른 페이지로 이동할 때 사용하는 함수다.
  */
  const navigate = useNavigate();

  /* 대시보드 카드에는 API에서 받은 최신 항목 3건만 표시한다. */
  const [notices, setNotices] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [riskEvents, setRiskEvents] = useState([]);
  // 부서별 위험 이벤트 조회 기간(일수). 1이면 departmentDate 하루만, 7/30이면
  // departmentDate를 종료일로 하는 최근 N일 범위를 본다.
  const [departmentPeriod, setDepartmentPeriod] = useState(1);
  const [departmentDate, setDepartmentDate] =
    useState(TODAY_DATE_INPUT);
  const [usageTrendMonth, setUsageTrendMonth] =
    useState(TODAY_DATE_INPUT.slice(0, 7));
  const [usageTrendData, setUsageTrendData] = useState([]);
  const [dashboardSummary, setDashboardSummary] =
    useState(EMPTY_SUMMARY);
  const [riskSummary, setRiskSummary] =
    useState(EMPTY_RISK_SUMMARY);
  const [evidenceSummary, setEvidenceSummary] =
    useState(EMPTY_EVIDENCE_SUMMARY);
  const [policyRequests, setPolicyRequests] = useState([]);
  const [aiToolApplications, setAiToolApplications] = useState([]);

  /*
    공지와 DLP 위험 이벤트는 서로 다른 서버이므로 독립적으로 조회한다.
    한 요청이 실패하더라도 정상 응답을 받은 영역은 계속 표시한다.
  */
  useEffect(() => {
    const fetchDashboardData = async () => {
      const [
        noticeResult,
        eventResult,
        usageTrendResult,
        summaryResult,
        evidenceResult,
      ] =
        await Promise.allSettled([
        getNotices(),
        getEvents(),
        getComplianceDashboardTrend(usageTrendMonth),
        getComplianceDashboardSummary(),
        isAdminView
          ? Promise.resolve({ data: EMPTY_EVIDENCE_SUMMARY })
          : getEvidenceSummary(new Date().getFullYear()),
      ]);

      if (noticeResult.status === "fulfilled") {
        const noticeResponse = noticeResult.value;
        const noticeData = Array.isArray(noticeResponse.data)
          ? noticeResponse.data
          : [];

        setNotices(
          [...noticeData]
            .sort((firstNotice, secondNotice) => {
              if (firstNotice.isPinned !== secondNotice.isPinned) {
                return Number(secondNotice.isPinned) -
                  Number(firstNotice.isPinned);
              }

              return new Date(secondNotice.createdAt).getTime() -
                new Date(firstNotice.createdAt).getTime();
            })
            .slice(0, 6)
            .map((notice) => ({
              id: notice.id,
              category: notice.category,
              title: notice.title,
              date: new Date(
                notice.createdAt,
              ).toLocaleDateString("ko-KR"),
              isPinned: Boolean(notice.isPinned),
            })),
        );
      } else {
        console.error("최근 공지 조회 실패", noticeResult.reason);
      }

      if (eventResult.status === "fulfilled") {
        const eventData = Array.isArray(eventResult.value.data)
          ? eventResult.value.data
          : [];

        setRiskEvents(eventData);
        const nextRiskSummary = { ...EMPTY_RISK_SUMMARY };

        // 상단 위험 현황은 기존처럼 전체 이벤트를 기준으로 집계한다.
        eventData.forEach((event) => {
          const grade = String(event.grade || "LOW").toLowerCase();

          if (Object.hasOwn(nextRiskSummary, grade)) {
            nextRiskSummary[grade] += 1;
          }
          if (
            grade === "high" &&
            getActionStatus(event.actions).type !== "completed"
          ) {
            nextRiskSummary.urgentActionCount += 1;
          }
        });

        setRiskSummary(nextRiskSummary);

        // 최신 이벤트 3건만 대시보드 위험 이벤트 관리 영역에 표시한다.
        setActionItems(
          [...eventData]
            .sort(
              (first, second) =>
                new Date(second.created_at).getTime() -
                new Date(first.created_at).getTime(),
            )
            .slice(0, 3)
            .map((event) => {
              const status = getActionStatus(event.actions);

              return {
                id: event.event_id,
                riskLevel: event.grade || "LOW",
                userName: event.user_name || "-",
                department: event.department_name || "-",
                eventType: formatDetectionType(event.detection_type) || "-",
                modelName: event.ai_tool_name || "-",
                actionStatus: status.label,
                actionStatusType: status.type,
                occurredAt: formatOccurredAt(event.created_at),
              };
            }),
        );
      } else {
        console.error("위험 이벤트 조회 실패", eventResult.reason);
      }

      if (summaryResult.status === "fulfilled") {
        setDashboardSummary({
          ...EMPTY_SUMMARY,
          ...(summaryResult.value.data || {}),
        });
      } else {
        console.error(
          "전사 사용 요약 조회 실패",
          summaryResult.reason,
        );
      }

      if (usageTrendResult.status === "fulfilled") {
        const usageItems = Array.isArray(
          usageTrendResult.value.data?.items,
        )
          ? usageTrendResult.value.data.items
          : [];
        const eventItems =
          eventResult.status === "fulfilled" &&
          Array.isArray(eventResult.value.data)
            ? eventResult.value.data
            : [];
        const riskCountByDate = new Map();

        // DLP 위험 이벤트도 날짜별로 집계해 전사 사용량과 합친다.
        eventItems.forEach((event) => {
          const date = new Date(event.created_at)
            .toISOString()
            .slice(0, 10);
          riskCountByDate.set(
            date,
            (riskCountByDate.get(date) || 0) + 1,
          );
        });

        setUsageTrendData(
          usageItems.map((item) => ({
            date: item.date.slice(5).replace("-", "/"),
            usageCount: item.usageCount,
            riskEventCount: riskCountByDate.get(item.date) || 0,
          })),
        );
      } else {
        console.error(
          "전사 월별 사용 추이 조회 실패",
          usageTrendResult.reason,
        );
      }

      if (evidenceResult.status === "fulfilled") {
        const evidenceData = evidenceResult.value.data || {};
        setEvidenceSummary({
          ...EMPTY_EVIDENCE_SUMMARY,
          ...evidenceData,
          categories:
            Array.isArray(evidenceData.categories) &&
            evidenceData.categories.length > 0
              ? evidenceData.categories
              : EMPTY_EVIDENCE_SUMMARY.categories,
        });
      } else {
        console.error(
          "상시평가 증빙자료 요약 조회 실패",
          evidenceResult.reason,
        );
      }
    };

    fetchDashboardData();
  }, [isAdminView, usageTrendMonth]);

  const departmentData = useMemo(() => {
    // departmentDate를 항상 기간의 종료일(포함)로 두고, 거기서 departmentPeriod일만큼
    // 거슬러 올라간 날짜를 시작일로 잡는다. 1일 모드는 종료일=시작일인 특수 케이스다.
    const [year, month, day] = departmentDate.split("-").map(Number);
    const periodEnd = new Date(year, month - 1, day + 1);
    const periodStart = new Date(year, month - 1, day - (departmentPeriod - 1));
    const departmentBuckets = new Map();

    riskEvents.forEach((event) => {
      const occurredAt = new Date(event.created_at);
      if (
        Number.isNaN(occurredAt.getTime()) ||
        occurredAt < periodStart ||
        occurredAt >= periodEnd
      ) {
        return;
      }

      const department = event.department_name || "미지정 부서";
      const current = departmentBuckets.get(department) || {
        department,
        high: 0,
        medium: 0,
        low: 0,
      };
      const grade = String(event.grade || "LOW").toLowerCase();

      if (Object.hasOwn(current, grade)) {
        current[grade] += 1;
      }
      departmentBuckets.set(department, current);
    });

    return [...departmentBuckets.values()].sort(
      (first, second) =>
        second.high +
        second.medium +
        second.low -
        (first.high + first.medium + first.low),
    );
  }, [departmentDate, departmentPeriod, riskEvents]);

  /*
    부서별 위험 이벤트 그래프 너비 계산용. 부서 수가 적어서 고정 슬롯 폭으로도
    패널을 다 못 채우면 실제 컨테이너 너비만큼 늘려서 꽉 채우고(지금처럼 2개
    부서면 화면 전체 너비를 씀), 부서가 늘어 고정 폭 합이 컨테이너보다 커지면
    그때부터는 컨테이너 너비에 맞추지 않고 고정 폭을 유지해 가로 스크롤이
    생기게 한다. 컨테이너의 실제 렌더링 너비는 리사이즈에 따라 바뀌므로
    ResizeObserver로 측정한다.
  */
  const departmentChartWrapRef = useRef(null);
  const [departmentChartContainerWidth, setDepartmentChartContainerWidth] = useState(0);

  useEffect(() => {
    const el = departmentChartWrapRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width;
      if (width) setDepartmentChartContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isAdminView) return;

    const fetchRequestStatuses = async () => {
      const [policyResult, aiToolResult] = await Promise.allSettled([
        getPolicies(),
        getAiToolApplications(),
      ]);

      if (policyResult.status === "fulfilled") {
        const policies = Array.isArray(policyResult.value.data)
          ? policyResult.value.data
          : [];
        setPolicyRequests(
          [...policies]
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .slice(0, 3),
        );
      } else {
        console.error("정책 요청 현황 조회 실패", policyResult.reason);
      }

      if (aiToolResult.status === "fulfilled") {
        const applications = Array.isArray(aiToolResult.value.data)
          ? aiToolResult.value.data
          : [];
        setAiToolApplications(applications.slice(0, 3));
      } else {
        console.error("AI Tool 신청 현황 조회 실패", aiToolResult.reason);
      }
    };

    fetchRequestStatuses();
  }, [isAdminView]);

  useEffect(() => {
    if (!isAdminView) return;

    const fetchAdminStatuses = async () => {
      const [aiToolResult, policyResult] = await Promise.allSettled([
        getAiToolApplications(),
        getPolicies(),
      ]);

      if (aiToolResult.status === "fulfilled") {
        const applications = Array.isArray(aiToolResult.value.data)
          ? aiToolResult.value.data
          : [];
        setAiToolApplications(applications);
      } else {
        console.error("관리자 AI 모델 현황 조회 실패", aiToolResult.reason);
      }

      if (policyResult.status === "fulfilled") {
        const policies = Array.isArray(policyResult.value.data)
          ? policyResult.value.data
          : [];
        setPolicyRequests(policies);
      } else {
        console.error("관리자 정책 승인 현황 조회 실패", policyResult.reason);
      }
    };

    fetchAdminStatuses();
  }, [isAdminView]);

  /* DLP 위험 등급별 건수를 도넛 차트 데이터로 변환한다. */
  const riskChartData = [
    { name: "HIGH", value: riskSummary.high, color: "#ff4d4f" },
    { name: "MEDIUM", value: riskSummary.medium, color: "#f59e0b" },
    { name: "LOW", value: riskSummary.low, color: "#10b981" },
  ];
  const adminModelMetrics = {
    unchecked: aiToolApplications.filter(
      (application) =>
        application.status === "PENDING" && !application.reviewedAt,
    ).length,
    pending: aiToolApplications.filter(
      (application) => application.status === "PENDING",
    ).length,
    active: aiToolApplications.filter(
      (application) =>
        application.status === "APPROVED" &&
        application.isActive !== false,
    ).length,
  };
  const adminPolicyMetrics = {
    pending: policyRequests.filter(
      (policy) => policy.approval_status === "pending",
    ).length,
    approved: policyRequests.filter(
      (policy) => policy.approval_status === "approved",
    ).length,
    rejected: policyRequests.filter(
      (policy) => policy.approval_status === "rejected",
    ).length,
  };
  const todayRiskEventCount = riskEvents.filter((event) => {
    const occurredAt = new Date(event.created_at);
    return !Number.isNaN(occurredAt.getTime()) &&
      formatDateInputValue(occurredAt) === TODAY_DATE_INPUT;
  }).length;

  /*
    공지사항 전체 보기 버튼을 누르면
    컴플라이언스 공지사항 페이지로 이동
  */
  const handleNoticeViewAll = () => {
    navigate("/compliance/notices");
  };

  /*
    개별 공지를 누른 경우에도
    현재는 공지사항 전체 페이지로 이동
  */
  const handleNoticeClick = (noticeId) => {
    markNoticeAsRead(noticeId);
    navigate("/compliance/notices");
  };

  /* 위험 이벤트 전체 보기와 개별 이벤트 상세 페이지 이동에 사용한다. */
  const handleRiskEventViewAll = () => {
    navigate("/compliance/risk-events");
  };

  const handleRiskEventClick = (eventId) => {
    navigate("/compliance/risk-events", {
      state: { selectedEventId: eventId },
    });
  };

  const handleEvidenceViewAll = () => {
    navigate("/compliance/evidence");
  };

  const handlePolicyViewAll = () => {
    navigate("/policies");
  };

  const handlePolicyClick = (policyId) => {
    navigate("/policies", {
      state: { selectedPolicyId: policyId },
    });
  };

  const handleAiToolViewAll = () => {
    navigate("/ai-tools");
  };

  const handleAdminModelViewAll = () => {
    navigate("/admin/models");
  };

  const handleAdminPolicyViewAll = () => {
    navigate("/admin/policies");
  };


  return (
    <div
      className={`compliance-dashboard-page ${
        isAdminView ? "admin-view" : ""
      }`}
    >
      {/* ==================================================
          전사 대시보드 제목 영역
      ================================================== */}
      <header className="compliance-dashboard-heading">
        <div>
          {/* 본문 대시보드 제목 */}
          <h2>전사 대시보드</h2>

          {/* 대시보드 데이터 기준일 */}
          <p className="compliance-dashboard-standard-date">
            {new Date().toLocaleDateString("ko-KR")} 기준
          </p>
        </div>

      </header>

      {/* ==================================================
          상단 요약 영역
      ================================================== */}
      <section
        className={`compliance-summary-grid ${
          isAdminView ? "admin-view" : ""
        }`}
      >
        {/* 최근 공지사항은 CSS 순서로 상단 가장 오른쪽에 표시한다. */}
        <article className="compliance-notice-panel">
          <div className="compliance-notice-header">
            <div>
              <Bell size={17} />
              <h3>공지사항</h3>
            </div>
            <button type="button" onClick={handleNoticeViewAll}>
              전체 보기
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="compliance-notice-list">
            {notices.length > 0 ? (
              notices.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  className={`compliance-notice-item ${
                    notice.isPinned ? "is-pinned" : ""
                  }`}
                  onClick={() => handleNoticeClick(notice.id)}
                >
                  <div>
                    <span className="compliance-notice-category">
                      {notice.category}
                    </span>
                    <strong>{notice.title}</strong>
                  </div>
                  <small>{notice.date}</small>
                </button>
              ))
            ) : (
              <div className="compliance-notice-empty">
                등록된 공지사항이 없습니다.
              </div>
            )}
          </div>
        </article>

        {/* 위험 이벤트 현황 카드 */}
        <article className="compliance-summary-card compliance-risk-summary-card">
          <div className="compliance-risk-card-content">
            <div className="compliance-risk-card-header">
              <span className="compliance-summary-label">
                위험 이벤트 현황
              </span>
              <span
                className="compliance-risk-urgent-count"
                aria-label="미조치 HIGH 위험 이벤트 건수"
              >
                HIGH 미조치 {riskSummary.urgentActionCount}건
              </span>
            </div>

            <div className="compliance-risk-card-body">
              {/* 위험 이벤트 비율 도넛 그래프 */}
              <div className="compliance-risk-donut">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={23}
                      outerRadius={36}
                      paddingAngle={1}
                      stroke="none"
                    >
                      {riskChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 위험 등급별 건수 */}
              <div className="compliance-risk-legend">
                <div className="compliance-risk-legend-row">
                  <span className="compliance-risk-dot risk-dot-high" />

                  <span>HIGH</span>

                  <strong>
                    {
                      riskSummary.high
                    }
                  </strong>
                </div>

                <div className="compliance-risk-legend-row">
                  <span className="compliance-risk-dot risk-dot-medium" />

                  <span>MEDIUM</span>

                  <strong>
                    {
                      riskSummary.medium
                    }
                  </strong>
                </div>

                <div className="compliance-risk-legend-row">
                  <span className="compliance-risk-dot risk-dot-low" />

                  <span>LOW</span>

                  <strong>
                    {
                      riskSummary.low
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* 토큰 사용량과 비용 카드 */}
        <article className="compliance-summary-card compliance-cost-summary-card">
          <div className="compliance-summary-icon compliance-summary-icon-cost">
            <CircleDollarSign size={22} />
          </div>

          <div className="compliance-summary-content">
            <span className="compliance-summary-label">
              토큰 사용량 / 비용
            </span>

            <strong className="compliance-summary-value">
              {formatNumber(dashboardSummary.totalTokens)} 토큰
            </strong>

            {dashboardSummary.costRatesConfigured && (
              <small>
                ₩{formatNumber(dashboardSummary.estimatedCostKrw)} / 이번 달
              </small>
            )}

            <small className="compliance-budget-description">
              Bedrock(Anthropic) 응답 기준 토큰 합계
            </small>

            {dashboardSummary.costRatesConfigured && (
              <small
                className="compliance-cost-disclaimer"
                title="크로스 리전 추론 프로파일 사용 시 부과되는 약 10% 할증은 이 추정치에 반영되어 있지 않습니다."
              >
                추정치(참고용) · 실제 청구액과 다를 수 있음
              </small>
            )}
          </div>
        </article>

        {!isAdminView && (
        <section className="compliance-evidence-progress-panel">
          <header className="compliance-evidence-progress-header">
            <div>
              <span><FileCheck2 size={18} /></span>
              <div>
                <h3>상시평가 증빙자료 준비</h3>
                <p>{new Date().getFullYear()}년 전사 준비 현황</p>
              </div>
            </div>
            <button type="button" onClick={handleEvidenceViewAll}>
              전체 보기
              <ArrowRight size={14} />
            </button>
          </header>

          <div className="compliance-evidence-overall">
            <div>
              <span>전체 이행률</span>
              <strong>{evidenceSummary.overallPercentage}%</strong>
            </div>
            <div className="compliance-evidence-progress-track">
              <span
                style={{
                  width: `${evidenceSummary.overallPercentage}%`,
                }}
              />
            </div>
            <small>
              {evidenceSummary.preparedCount} / {evidenceSummary.totalCount}개
              항목 준비완료
            </small>
          </div>

          <div className="compliance-evidence-category-list">
            {evidenceSummary.categories.map((category) => (
              <div
                key={category.key}
                className="compliance-evidence-category-item"
              >
                <div>
                  <span>{category.label}</span>
                  <strong>{category.percentage}%</strong>
                </div>
                <div className="compliance-evidence-progress-track small">
                  <span style={{ width: `${category.percentage}%` }} />
                </div>
                <small>
                  {category.preparedCount}/{category.totalCount}
                </small>
              </div>
            ))}
          </div>
        </section>
        )}

        {isAdminView && (
        <section className="compliance-request-status-panel compliance-admin-model-panel">
          <header className="compliance-request-status-header">
            <div>
              <span><Boxes size={17} /></span>
              <h3>AI 모델 관리</h3>
            </div>
            <button type="button" onClick={handleAdminModelViewAll}>
              전체 보기
              <ArrowRight size={14} />
            </button>
          </header>
          <div className="compliance-admin-model-metrics">
            <button type="button" onClick={handleAdminModelViewAll}>
              <span>신규 신청</span>
              <strong>{adminModelMetrics.unchecked}</strong>
              <small>검토 전 신청</small>
            </button>
            <button type="button" onClick={handleAdminModelViewAll}>
              <span>승인 대기</span>
              <strong>{adminModelMetrics.pending}</strong>
              <small>승인 처리가 필요한 신청</small>
            </button>
            <button type="button" onClick={handleAdminModelViewAll}>
              <span>활성 모델</span>
              <strong>{adminModelMetrics.active}</strong>
              <small>현재 사용 가능한 모델</small>
            </button>
          </div>
        </section>
        )}

        {isAdminView && (
        <section className="compliance-request-status-panel compliance-admin-policy-panel">
          <header className="compliance-request-status-header">
            <div>
              <span><ClipboardList size={17} /></span>
              <h3>정책 승인 현황</h3>
            </div>
            <button type="button" onClick={handleAdminPolicyViewAll}>
              전체 보기
              <ArrowRight size={14} />
            </button>
          </header>
          <div className="compliance-admin-model-metrics">
            <button type="button" onClick={handleAdminPolicyViewAll}>
              <span>승인 대기</span>
              <strong>{adminPolicyMetrics.pending}</strong>
              <small>검토가 필요한 정책</small>
            </button>
            <button type="button" onClick={handleAdminPolicyViewAll}>
              <span>승인 완료</span>
              <strong>{adminPolicyMetrics.approved}</strong>
              <small>승인 처리된 정책</small>
            </button>
            <button type="button" onClick={handleAdminPolicyViewAll}>
              <span>반려</span>
              <strong>{adminPolicyMetrics.rejected}</strong>
              <small>보완이 필요한 정책</small>
            </button>
          </div>
        </section>
        )}

      </section>

      <div
        className={`compliance-dashboard-detail-grid ${
          isAdminView ? "admin-view" : ""
        }`}
      >

      {/* ==================================================
          두 번째 줄: 위험 이벤트 관리
      ================================================== */}
      <div className="compliance-dashboard-second-row">
        <section className="compliance-action-required-panel">
        {/* 조치 필요 패널 제목 */}
        <header className="compliance-action-required-header">
          <div className="compliance-action-required-title">
            {/* 조치가 필요하다는 것을 나타내는 빨간 점 */}
            <span className="compliance-action-required-dot" />

            <h3>위험 이벤트 관리</h3>

            {/* 이벤트 항목 수 */}
            <span className="compliance-action-required-count">
              오늘 {todayRiskEventCount}건
            </span>
          </div>

          <div className="compliance-action-required-header-actions">
            <button
              type="button"
              onClick={handleRiskEventViewAll}
            >
              전체 보기
              <ArrowRight size={14} />
            </button>
          </div>
        </header>

        {/* 조치 필요 위험 이벤트 목록 */}
        <div className="compliance-action-required-list">
          {actionItems.length > 0 ? (
            actionItems.map((item) => {
              /*
                HIGH → high
                MEDIUM → medium

                위험 등급별 CSS 클래스를 적용하기 위해
                소문자로 변환한다.
              */
              const riskClass =
                item.riskLevel.toLowerCase();

              return (
                <article
                  key={item.id}
                  className="compliance-action-required-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRiskEventClick(item.id)}
                  onKeyDown={(event) => {
                    if (["Enter", " "].includes(event.key)) {
                      event.preventDefault();
                      handleRiskEventClick(item.id);
                    }
                  }}
                >
                  {/* 위험 등급 */}
                  <div className="compliance-action-risk-area">
                    <span
                      className={`
                        compliance-action-risk-badge
                        ${riskClass}
                      `}
                    >
                      {item.riskLevel}
                    </span>
                  </div>

                  {/* 위험 이벤트 정보 */}
                  <div className="compliance-action-item-content">
                    {/* 사용자, 부서, 탐지 유형 */}
                    <div className="compliance-action-item-primary">
                      <strong>{item.userName}</strong>

                      <span className="compliance-action-department">
                        {item.department}
                      </span>

                      <span className="compliance-action-event-type">
                        {item.eventType}
                      </span>
                    </div>

                    {/* 모델명, 상태, 발생 시간 */}
                    <div className="compliance-action-item-secondary">
                      <span>{item.modelName}</span>

                      <i aria-hidden="true">·</i>

                      <span
                        className={`
                          compliance-action-status
                          ${item.actionStatusType}
                        `}
                      >
                        {item.actionStatus}
                      </span>

                      <i aria-hidden="true">·</i>

                      <span className="compliance-action-time">
                        <Clock3 size={14} />

                        {item.occurredAt}
                      </span>
                    </div>
                  </div>

                </article>
              );
            })
          ) : (
            /*
              최근 이슈가 없는 경우 표시한다.
            */
            <div className="compliance-action-required-empty">
              최근 이슈가 없습니다.
            </div>
          )}
        </div>
        </section>

        {!isAdminView && (
        <section className="compliance-request-status-panel compliance-policy-request-panel">
          <header className="compliance-request-status-header">
            <div>
              <span><ClipboardList size={17} /></span>
              <h3>정책 요청 현황</h3>
            </div>
            <button type="button" onClick={handlePolicyViewAll}>
              전체 보기
              <ArrowRight size={14} />
            </button>
          </header>
          <div className="compliance-request-status-list compliance-dashboard-request-cards">
            {policyRequests.length > 0 ? (
              policyRequests.map((policy) => {
                const status = policy.approval_status || "pending";
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => handlePolicyClick(policy.id)}
                  >
                    <div>
                      <strong>{policy.name}</strong>
                      <small>{policy.department_name || "부서 미지정"}</small>
                      <p>
                        {typeof policy.rule_content === "string"
                          ? policy.rule_content
                          : "정책 요청"}
                      </p>
                      <time>
                        신청일{" "}
                        {policy.createdAt
                          ? new Date(policy.createdAt).toLocaleDateString(
                              "ko-KR",
                            )
                          : "-"}
                      </time>
                    </div>
                    <span className={`status-${status.toLowerCase()}`}>
                      {REQUEST_STATUS_LABELS[status] || status}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="compliance-request-status-empty">
                등록된 정책 요청이 없습니다.
              </p>
            )}
          </div>
        </section>
        )}

        {!isAdminView && (
        <section className="compliance-request-status-panel compliance-ai-tool-request-panel">
          <header className="compliance-request-status-header">
            <div>
              <span><Boxes size={17} /></span>
              <h3>AI 모델 신청 현황</h3>
            </div>
            <button type="button" onClick={handleAiToolViewAll}>
              전체 보기
              <ArrowRight size={14} />
            </button>
          </header>
          <div className="compliance-request-status-list compliance-dashboard-request-cards">
            {aiToolApplications.length > 0 ? (
              aiToolApplications.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  onClick={handleAiToolViewAll}
                >
                  <div>
                    <strong>{application.toolName}</strong>
                    <small>{application.provider}</small>
                    <p>{application.purpose || "사용 목적 미입력"}</p>
                    <time>
                      신청일{" "}
                      {application.createdAt
                        ? new Date(application.createdAt).toLocaleDateString(
                            "ko-KR",
                          )
                        : "-"}
                    </time>
                  </div>
                  <span
                    className={`status-${application.status.toLowerCase()}`}
                  >
                    {REQUEST_STATUS_LABELS[application.status] ||
                      application.status}
                  </span>
                </button>
              ))
            ) : (
              <p className="compliance-request-status-empty">
                등록된 AI 모델 신청이 없습니다.
              </p>
            )}
          </div>
        </section>
        )}

      </div>



      {/* ==================================================
          부서별 위험 이벤트
      ================================================== */}
      <section className="compliance-dashboard-panel compliance-department-risk-panel">
        <div className="compliance-panel-header">
          <div>
            <h3>부서별 위험 이벤트</h3>

            <p>
              선택한 기간의 부서별 위험 이벤트입니다.
            </p>
          </div>

          <div className="compliance-department-chart-controls">
            <div
              className="compliance-department-period-filter"
              aria-label="부서별 위험 이벤트 조회 기간"
            >
              {[
                { value: 7, label: "최근 7일" },
                { value: 30, label: "최근 30일" },
              ].map((period) => (
                <button
                  key={period.value}
                  type="button"
                  className={
                    departmentPeriod === period.value ? "active" : ""
                  }
                  onClick={() =>
                    // 이미 선택된 기간 버튼을 다시 누르면 하루 단위 보기로 돌아간다.
                    setDepartmentPeriod((current) =>
                      current === period.value ? 1 : period.value,
                    )
                  }
                >
                  {period.label}
                </button>
              ))}
            </div>
            <label
              className={`compliance-department-date-filter ${
                departmentPeriod === 1 ? "active" : ""
              }`}
            >
              <span>날짜</span>
              <input
                type="date"
                value={departmentDate}
                max={TODAY_DATE_INPUT}
                onChange={(event) => {
                  if (!event.target.value) return;
                  // 기간(7일/30일)이 선택된 상태에서 날짜를 바꾸면 그 기간은 유지한 채
                  // 선택한 날짜를 종료일로 다시 계산한다.
                  setDepartmentDate(event.target.value);
                }}
              />
            </label>

            {/* 그래프 색상 설명 */}
            <div className="compliance-chart-legend">
              <span>
                <i className="chart-dot-high" />
                HIGH
              </span>

              <span>
                <i className="chart-dot-medium" />
                MEDIUM
              </span>

              <span>
                <i className="chart-dot-low" />
                LOW
              </span>
            </div>
          </div>
        </div>

        <div className="compliance-department-chart" ref={departmentChartWrapRef}>
          {departmentData.length === 0 ? (
            <div className="compliance-department-chart-empty">
              조회된 데이터가 없습니다.
            </div>
          ) : (
            <BarChart
              width={Math.max(
                departmentData.length * DEPARTMENT_CHART_SLOT_WIDTH,
                departmentChartContainerWidth || DEPARTMENT_CHART_MIN_WIDTH,
              )}
              height={245}
              data={departmentData}
              margin={{
                top: 10,
                right: 20,
                left: -10,
                bottom: 8,
              }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#e4eaf3"
              />

              <XAxis
                dataKey="department"
                tick={{
                  fontSize: 10,
                  fill: "#71809a",
                }}
                axisLine={{
                  stroke: "#bec8d8",
                }}
                tickLine={false}
                interval={0}
                angle={0}
                textAnchor="middle"
                tickMargin={10}
                height={40}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 10,
                  fill: "#71809a",
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                itemSorter={(item) => {
                  const riskOrder = {
                    HIGH: 0,
                    MEDIUM: 1,
                    LOW: 2,
                  };

                  return riskOrder[item.name] ?? 3;
                }}
              />

              <Bar
                dataKey="high"
                name="HIGH"
                stackId="risk"
                fill="#ff4d4f"
                radius={[0, 0, 0, 0]}
              />

              <Bar
                dataKey="medium"
                name="MEDIUM"
                stackId="risk"
                fill="#f59e0b"
              />

              <Bar
                dataKey="low"
                name="LOW"
                stackId="risk"
                fill="#10b981"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          )}
        </div>
      </section>

      {/* 선택한 월의 일별 사용 추이 */}
      <section className="compliance-dashboard-panel compliance-usage-trend-panel">
        <div className="compliance-panel-header">
          <div>
            <h3>월별 사용 추이</h3>

            <p>
              선택한 월의 일별 AI 사용량과 위험 이벤트를 비교합니다.
            </p>
          </div>
          <label className="compliance-usage-month-filter">
            <span>조회 월</span>
            <select
              value={usageTrendMonth}
              onChange={(event) => setUsageTrendMonth(event.target.value)}
              aria-label="사용 추이 조회 월"
            >
              {USAGE_MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="compliance-usage-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={usageTrendData}
              margin={{
                top: 15,
                right: 25,
                left: -10,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#e4eaf3"
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 10,
                  fill: "#71809a",
                }}
                axisLine={{
                  stroke: "#bec8d8",
                }}
                tickLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 10,
                  fill: "#71809a",
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip />

              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  paddingTop: 10,
                }}
              />

              <Line
                type="monotone"
                dataKey="usageCount"
                name="AI 사용 횟수"
                stroke="#2f6fed"
                strokeWidth={3}
                dot={{
                  r: 3,
                  fill: "#ffffff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                }}
              />

              <Line
                type="monotone"
                dataKey="riskEventCount"
                name="위험 이벤트 발생 건수"
                stroke="#ff4d5e"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: "#ffffff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      </div>
    </div>
  );
}

export default ComplianceDashboardPage;
