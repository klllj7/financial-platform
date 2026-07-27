import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* 전사 대시보드에 표시할 아이콘 */
import {
  Activity,
  ArrowRight,
  Bell,
  CircleDollarSign,
  Clock3,
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
import {
  getComplianceDashboardSummary,
  getComplianceDashboardTrend,
} from "../../../api/dashboardApi";

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
  usageCount: 0,
  previousMonthDifference: 0,
  totalTokens: 0,
  estimatedCostKrw: 0,
};

const EMPTY_RISK_SUMMARY = {
  high: 0,
  medium: 0,
  low: 0,
  urgentActionCount: 0,
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


function ComplianceDashboardPage() {
  /*
    다른 페이지로 이동할 때 사용하는 함수다.
  */
  const navigate = useNavigate();

  /* 대시보드 카드에는 API에서 받은 최신 항목 3건만 표시한다. */
  const [notices, setNotices] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [usageTrendData, setUsageTrendData] = useState([]);
  const [dashboardSummary, setDashboardSummary] =
    useState(EMPTY_SUMMARY);
  const [riskSummary, setRiskSummary] =
    useState(EMPTY_RISK_SUMMARY);

  /*
    공지와 DLP 위험 이벤트는 서로 다른 서버이므로 독립적으로 조회한다.
    한 요청이 실패하더라도 정상 응답을 받은 영역은 계속 표시한다.
  */
  useEffect(() => {
    const fetchDashboardData = async () => {
      const [noticeResult, eventResult, usageTrendResult, summaryResult] =
        await Promise.allSettled([
        getNotices(),
        getEvents(),
        getComplianceDashboardTrend(30),
        getComplianceDashboardSummary(),
      ]);

      if (noticeResult.status === "fulfilled") {
        const noticeResponse = noticeResult.value;
        const noticeData = Array.isArray(noticeResponse.data)
          ? noticeResponse.data
          : [];

        setNotices(
          noticeData.slice(0, 3).map((notice) => ({
            id: notice.id,
            category: notice.category,
            title: notice.title,
            date: new Date(
              notice.createdAt,
            ).toLocaleDateString("ko-KR"),
          })),
        );
      } else {
        console.error("최근 공지 조회 실패", noticeResult.reason);
      }

      if (eventResult.status === "fulfilled") {
        const eventData = Array.isArray(eventResult.value.data)
          ? eventResult.value.data
          : [];

        // 부서와 위험 등급별 이벤트 수를 누적해 막대 차트 데이터로 만든다.
        const departmentBuckets = new Map();
        const nextRiskSummary = { ...EMPTY_RISK_SUMMARY };
        eventData.forEach((event) => {
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
            nextRiskSummary[grade] += 1;
          }
          if (
            grade === "high" &&
            getActionStatus(event.actions).type !== "completed"
          ) {
            nextRiskSummary.urgentActionCount += 1;
          }
          departmentBuckets.set(department, current);
        });
        setRiskSummary(nextRiskSummary);
        setDepartmentData(
          [...departmentBuckets.values()].sort(
            (first, second) =>
              second.high +
              second.medium +
              second.low -
              (first.high + first.medium + first.low),
          ),
        );

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
                eventType: event.detection_type || "-",
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
          "전사 30일 사용 추이 조회 실패",
          usageTrendResult.reason,
        );
      }
    };

    fetchDashboardData();
  }, []);

  /* DLP 위험 등급별 건수를 도넛 차트 데이터로 변환한다. */
  const riskChartData = [
    { name: "HIGH", value: riskSummary.high, color: "#ff4d4f" },
    { name: "MEDIUM", value: riskSummary.medium, color: "#f59e0b" },
    { name: "LOW", value: riskSummary.low, color: "#10b981" },
  ];

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
  const handleNoticeClick = () => {
    navigate("/compliance/notices");
  };


  return (
    <div className="compliance-dashboard-page">
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
      <section className="compliance-summary-grid">
        {/* 전사 AI 사용 횟수 카드 */}
        <article className="compliance-summary-card">
          <div className="compliance-summary-icon compliance-summary-icon-primary">
            <Activity size={22} />
          </div>

          <div className="compliance-summary-content">
            <span className="compliance-summary-label">
              AI 사용 횟수
            </span>

            <strong className="compliance-summary-value">
              {formatNumber(
                dashboardSummary.usageCount,
              )}
              회
            </strong>

            <small>
              전월 대비{" "}
              {dashboardSummary.previousMonthDifference >= 0 ? "+" : ""}
              {dashboardSummary.previousMonthDifference}회
            </small>
          </div>
        </article>

        {/* 위험 이벤트 현황 카드 */}
        <article className="compliance-summary-card compliance-risk-summary-card">
          <div className="compliance-risk-card-content">
            <span className="compliance-summary-label">
              위험 이벤트 현황
            </span>

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

                  <button
                    type="button"
                    aria-label="즉시 조치가 필요한 위험 이벤트 건수"
                  >
                    즉시 조치{" "}
                    {
                      riskSummary.urgentActionCount
                    }
                    건
                  </button>
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
        <article className="compliance-summary-card">
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

            <small>
              ₩
              {formatNumber(
                dashboardSummary.estimatedCostKrw,
              )}{" "}
              / 이번 달
            </small>

            <small className="compliance-budget-description">
              Claude API 응답의 실제 입·출력 토큰 합계
            </small>
          </div>
        </article>

      </section>


      {/* ==================================================
          두 번째 줄: 위험 이벤트 관리와 최근 공지사항
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
              {actionItems.length}건
            </span>
          </div>

          <div className="compliance-action-required-header-actions">
            <p><strong>HIGH 등급 우선 정렬</strong></p>
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

        {/* 최근 공지사항을 위험 이벤트 관리 오른쪽에 표시한다. */}
        <article className="compliance-notice-panel">
          <div className="compliance-notice-header">
            <div>
              <Bell size={17} />

              <h3>최근 공지사항</h3>
            </div>

            <button
              type="button"
              onClick={handleNoticeViewAll}
            >
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
                  className="compliance-notice-item"
                  onClick={handleNoticeClick}
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
      </div>



      {/* ==================================================
          부서별 위험 이벤트
      ================================================== */}
      <section className="compliance-dashboard-panel compliance-department-risk-panel">
        <div className="compliance-panel-header">
          <div>
            <h3>부서별 위험 이벤트</h3>

            <p>
              막대를 클릭하면 해당 부서의 위험 이벤트를
              확인할 수 있습니다.
            </p>
          </div>

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

        <div className="compliance-department-chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={departmentData}
              margin={{
                top: 10,
                right: 20,
                left: -10,
                bottom: 20,
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
                angle={-18}
                textAnchor="end"
                height={54}
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
          </ResponsiveContainer>
        </div>
      </section>

      {/* ==================================================
          30일 사용 추이
      ================================================== */}
      <section className="compliance-dashboard-panel compliance-usage-trend-panel">
        <div className="compliance-panel-header">
          <div>
            <h3>30일 사용 추이</h3>

            <p>
              전사 AI 사용량과 위험 이벤트 발생 건수를
              비교합니다.
            </p>
          </div>
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
  );
}

export default ComplianceDashboardPage;
