import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* 전사 대시보드에 표시할 아이콘 */
import {
  Activity,
  ArrowRight,
  Bell,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Cuboid,
  Wrench,
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

/*
  화면 구현에 사용할 Mock 데이터

  현재는 임시 데이터지만
  추후 백엔드 API 응답값으로 교체할 수 있다.
*/
import {
  complianceActionItems,
  complianceDashboardSummary,
  complianceRiskChartData,
  complianceUsageTrendData,
  departmentRiskData,
} from "../../../mocks/complianceDashboardMock";

/* 최근 공지와 AI Tool 신청 현황을 실제 백엔드에서 조회한다. */
import { getNotices } from "../../../api/noticeApi";
import { getAiToolApplications } from "../../../api/aiToolApi";

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


function ComplianceDashboardPage() {
  /*
    다른 페이지로 이동할 때 사용하는 함수다.
  */
  const navigate = useNavigate();

  /* 대시보드 카드에는 API에서 받은 최신 항목 3건만 표시한다. */
  const [notices, setNotices] = useState([]);
  const [modelApplications, setModelApplications] =
    useState([]);

  /*
    공지와 신청 현황을 함께 조회하고,
    현재 대시보드 UI가 사용하는 필드 이름으로 변환한다.
  */
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [noticeResponse, applicationResponse] =
          await Promise.all([
            getNotices(),
            getAiToolApplications(),
          ]);

        const noticeData = Array.isArray(noticeResponse.data)
          ? noticeResponse.data
          : [];
        const applicationData = Array.isArray(
          applicationResponse.data,
        )
          ? applicationResponse.data
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

        setModelApplications(
          applicationData.slice(0, 3).map((application) => ({
            id: application.id,
            applicantName: application.applicantName,
            department: application.departmentName || "-",
            requestName: application.toolName,
            requestType: "AI Tool",
            requestedAt: new Date(
              application.createdAt,
            ).toLocaleDateString("ko-KR"),
            status:
              application.status === "APPROVED"
                ? "승인"
                : application.status === "REJECTED"
                  ? "반려"
                  : "검토 대기",
            statusType:
              application.status === "APPROVED"
                ? "approved"
                : application.status === "REJECTED"
                  ? "rejected"
                  : "pending",
          })),
        );
      } catch (error) {
        console.error(
          "컴플라이언스 대시보드 데이터 조회 실패",
          error,
        );
      }
    };

    fetchDashboardData();
  }, []);

  /*
    아직 API가 연결되지 않은 위험·사용량 통계는
    기존 Mock 데이터로 안전하게 표시한다.
  */

  const riskChartData = Array.isArray(
    complianceRiskChartData,
  )
    ? complianceRiskChartData
    : [];

  const actionItems = Array.isArray(
    complianceActionItems,
  )
    ? complianceActionItems.slice(0, 3)
    : [];

  const departmentData = Array.isArray(
    departmentRiskData,
  )
    ? departmentRiskData
    : [];

  const usageTrendData = Array.isArray(
    complianceUsageTrendData,
  )
    ? complianceUsageTrendData
    : [];

  /*
    AI 모델 신청 현황 페이지는 아직 없으므로
    현재는 임시 안내창을 표시한다.
  */
  const handleModelApplicationClick = () => {
    navigate("/compliance/model-applications");
  };

  const handleModelApplicationItemClick = (applicationId) => {
    navigate("/compliance/model-applications", {
      state: { selectedApplicationId: applicationId },
    });
  };

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
            {complianceDashboardSummary.기준Date} 기준
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
                complianceDashboardSummary.totalUsageCount,
              )}
              회
            </strong>

            <small>
              전월 대비 +
              {
                complianceDashboardSummary
                  .usageChangeRate
              }
              %
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
                      complianceDashboardSummary
                        .riskCount.high
                    }
                  </strong>

                  <button
                    type="button"
                    aria-label="즉시 조치가 필요한 위험 이벤트 건수"
                  >
                    즉시 조치{" "}
                    {
                      complianceDashboardSummary
                        .urgentActionCount
                    }
                    건
                  </button>
                </div>

                <div className="compliance-risk-legend-row">
                  <span className="compliance-risk-dot risk-dot-medium" />

                  <span>MEDIUM</span>

                  <strong>
                    {
                      complianceDashboardSummary
                        .riskCount.medium
                    }
                  </strong>
                </div>

                <div className="compliance-risk-legend-row">
                  <span className="compliance-risk-dot risk-dot-low" />

                  <span>LOW</span>

                  <strong>
                    {
                      complianceDashboardSummary
                        .riskCount.low
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
              {complianceDashboardSummary.tokenUsage} 토큰
            </strong>

            <small>
              ₩
              {formatNumber(
                complianceDashboardSummary.estimatedCost,
              )}{" "}
              / 이번 달
            </small>

            {/* 현재 예산 사용 비율 */}
            <div className="compliance-budget-progress">
              <span
                style={{
                  width: `${complianceDashboardSummary.budgetUsageRate}%`,
                }}
              />
            </div>

            <small className="compliance-budget-description">
              예산 ₩
              {formatNumber(
                complianceDashboardSummary.monthlyBudget,
              )}{" "}
              중{" "}
              {
                complianceDashboardSummary
                  .budgetUsageRate
              }
              % 사용
            </small>
          </div>
        </article>

        {/* 최근 공지사항 카드 */}
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
            {notices.map((notice) => (
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
            ))}
          </div>
        </article>
      </section>


      {/* ==================================================
          오늘의 조치 필요 항목
      ================================================== */}
      <div className="compliance-issue-application-grid">
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

      {/* ==================================================
          AI Tool · 모델 신청 현황
      ================================================== */}
      <section className="compliance-model-application-panel">
        <header className="compliance-model-application-header">
          <div className="compliance-model-application-title">
            <span className="compliance-model-application-icon">
              <Cuboid size={17} />
            </span>

            <h3>AI Tool · 모델 신청 현황</h3>

            <span className="compliance-model-application-count">
              {modelApplications.length}건
            </span>
          </div>

          <button
            type="button"
            onClick={handleModelApplicationClick}
          >
            전체 보기

            <ArrowRight size={14} />
          </button>
        </header>

        <div className="compliance-model-application-list">
          {modelApplications.length > 0 ? (
            modelApplications.map((application) => (
              <button
                key={application.id}
                type="button"
                className="compliance-model-application-item"
                onClick={() =>
                  handleModelApplicationItemClick(application.id)
                }
              >
                <span className="compliance-model-application-item-icon">
                  <Wrench size={16} />
                </span>

                <span className="compliance-model-application-content">
                  <span className="compliance-model-application-primary">
                    <strong>{application.requestName}</strong>

                    <span>{application.requestType}</span>
                  </span>

                  <span className="compliance-model-application-meta">
                    {application.applicantName}
                    <i aria-hidden="true">·</i>
                    {application.department}
                    <i aria-hidden="true">·</i>
                    {application.requestedAt}
                  </span>
                </span>

                <span
                  className={`
                    compliance-model-application-status
                    ${application.statusType}
                  `}
                >
                  {application.status}
                </span>

                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <div className="compliance-model-application-empty">
              접수된 신청이 없습니다.
            </div>
          )}
        </div>
      </section>
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
