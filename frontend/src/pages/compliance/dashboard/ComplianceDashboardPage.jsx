/*
  페이지 이동 기능을 사용하기 위해
  React Router의 useNavigate를 가져온다.
*/

/*
  전사 대시보드에 표시할 아이콘을 가져온다.
*/
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CircleDollarSign,
  Cuboid,
} from "lucide-react";

/*
  대시보드 그래프를 구현하기 위해
  Recharts에서 필요한 컴포넌트를 가져온다.
*/
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
  화면 구현에 사용할 Mock 데이터를 가져온다.

  현재는 임시 데이터지만
  추후 백엔드 API 응답값으로 교체할 수 있다.
*/
import {
  complianceDashboardSummary,
  complianceNoticeData,
  complianceRiskChartData,
  complianceUsageTrendData,
  departmentRiskData,
} from "../../../mocks/complianceDashboardMock";

/*
  전사 대시보드 전용 CSS
*/
import "./ComplianceDashboardPage.css";


/*
  숫자를 대한민국 원화 형식으로 바꾸는 함수다.

  예:
  1284000
  → 1,284,000
*/
const formatWon = (value) => {
  return new Intl.NumberFormat("ko-KR").format(value);
};


function ComplianceDashboardPage() {

  /*
    Mock 데이터가 배열이 아니어도
    화면이 멈추지 않도록 빈 배열을 사용한다.
  */
  const notices = Array.isArray(complianceNoticeData)
    ? complianceNoticeData
    : [];

  const riskChartData = Array.isArray(
    complianceRiskChartData,
  )
    ? complianceRiskChartData
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
    위험 이벤트 관리 페이지는 아직 구현 전이므로
    현재는 안내창을 표시한다.

    RiskEventPage를 만든 후에는 아래 코드를
    navigate("/compliance/risk-events")로 바꾸면 된다.
  */
  const handleRiskEventClick = () => {
    alert("위험 이벤트 관리 페이지는 현재 구현 중입니다.");
  };

  /*
    AI 모델 신청 현황 페이지는 아직 없으므로
    현재는 임시 안내창을 표시한다.
  */
  const handleModelApplicationClick = () => {
    alert("AI 모델 신청 현황 페이지는 현재 구현 중입니다.");
  };

  /*
    컴플라이언스 전용 공지사항 페이지가 아직 없으므로
    현재는 안내창을 표시한다.
  */
  const handleNoticeViewAll = () => {
    alert("컴플라이언스 공지사항 페이지는 현재 구현 중입니다.");
  };

  /*
    개별 공지사항을 클릭했을 때 실행한다.
  */
  const handleNoticeClick = () => {
    alert("공지사항 상세 페이지는 현재 구현 중입니다.");
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

          {/* 오늘 조치가 필요한 위험 이벤트 안내 */}
          <p>
            <button
              type="button"
              className="compliance-action-summary-button"
              onClick={handleRiskEventClick}
            >
              오늘 조치 필요{" "}
              <strong>
                {complianceDashboardSummary.actionRequiredCount}건
              </strong>{" "}
              있음
            </button>

            <span className="compliance-dashboard-standard-date">
              · {complianceDashboardSummary.기준Date} 기준
            </span>
          </p>
        </div>

        {/* AI 모델 신청 현황 버튼 */}
        <button
          type="button"
          className="compliance-model-application-button"
          onClick={handleModelApplicationClick}
        >
          <Cuboid size={16} />

          AI 모델 신청 현황
        </button>
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
              {formatWon(
                complianceDashboardSummary.totalUsageCount,
              )}
              회
            </strong>

            <small>
              전월 대비 +
              {complianceDashboardSummary.usageChangeRate}%
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
                      complianceDashboardSummary.riskCount
                        .high
                    }
                  </strong>

                  <button
                    type="button"
                    onClick={handleRiskEventClick}
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
                      complianceDashboardSummary.riskCount
                        .medium
                    }
                  </strong>
                </div>

                <div className="compliance-risk-legend-row">
                  <span className="compliance-risk-dot risk-dot-low" />
                  <span>LOW</span>
                  <strong>
                    {
                      complianceDashboardSummary.riskCount
                        .low
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
              {formatWon(
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
              {formatWon(
                complianceDashboardSummary.monthlyBudget,
              )}{" "}
              중{" "}
              {complianceDashboardSummary.budgetUsageRate}% 사용
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
              onClick={handleRiskEventClick}
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