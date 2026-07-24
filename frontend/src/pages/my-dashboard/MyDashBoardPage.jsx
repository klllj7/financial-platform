// 월 선택 상태와 대시보드 API 조회 시점을 관리하기 위해 사용
import { useEffect, useState } from "react";

// 버튼 클릭 시 다른 페이지로 이동하기 위해 useNavigate를 사용
import { useNavigate } from "react-router-dom";

/* 대시보드에서 사용할 아이콘 */
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  ClipboardList,
} from "lucide-react";

/* 최근 7일 사용 추이 그래프에 사용할 Recharts 컴포넌트 */
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* 아직 API가 연결되지 않은 사용량·위험 통계용 Mock 데이터 */
import {
  dashboardSummary,
  modelAllocationData,
  recentUsageData,
  usageTrendData,
} from "../../mocks/dashboardMock";

/* 공지사항과 AI Tool 신청 현황을 백엔드에서 조회한다. */
import { getNotices } from "../../api/noticeApi";
import { getAiToolApplications } from "../../api/aiToolApi";

/* 대시보드 전용 CSS */
import "./MyDashboardPage.css";

/*
  월 선택 탭에 표시할 목록

  현재는 선택한 월의 버튼 표시만 변경되고,
  실제 월별 데이터 변경은 백엔드 연결 후 구현
*/
const MONTH_OPTIONS = [
  "2026년 07월",
  "2026년 06월",
  "2026년 05월",
  "2026년 04월",
];

/*
  위험 등급에 맞는 CSS 클래스 이름을 반환

  LOW    → risk-low
  MEDIUM → risk-medium
  HIGH   → risk-high
*/
const getRiskClassName = (riskLevel) => {
  return `risk-badge risk-${riskLevel.toLowerCase()}`;
};

/*
  조치 상태에 맞는 CSS 클래스 이름을 반환
*/
const getActionClassName = (actionStatus) => {
  if (actionStatus === "경고 발송") {
    return "action-badge action-warning";
  }

  if (actionStatus === "모니터링") {
    return "action-badge action-monitoring";
  }

  return "action-badge action-none";
};

function MyDashboardPage() {
  /*
    공지사항, AI Tool 페이지 등
    다른 페이지로 이동하기 위해 사용
  */
  const navigate = useNavigate();

  /*
    현재 선택된 월을 저장

    처음 대시보드에 들어오면
    2026년 07월이 선택되어 있음
  */
  const [selectedMonth, setSelectedMonth] =
    useState("2026년 07월");

  /* 대시보드에는 서버에서 조회한 최신 데이터 3건만 저장한다. */
  const [notices, setNotices] = useState([]);
  const [toolApplications, setToolApplications] =
    useState([]);

  /*
    백엔드 응답을 기존 대시보드 카드가 사용하는 표시 형식으로 변환한다.
    API 연결 실패 시 Mock 데이터는 사용하지 않고 빈 상태를 유지한다.
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
          noticeData.slice(0, 3).map((notice) => {
            const createdAt = new Date(notice.createdAt);
            const isNew =
              Date.now() - createdAt.getTime() <=
              3 * 24 * 60 * 60 * 1000;

            return {
              id: notice.id,
              category: notice.category,
              title: notice.title,
              createdAt: createdAt.toLocaleDateString("ko-KR"),
              isNew,
            };
          }),
        );

        setToolApplications(
          applicationData.slice(0, 3).map((application) => ({
            id: application.id,
            toolName: application.toolName,
            provider: application.provider,
            purpose: application.purpose,
            requestedAt: new Date(
              application.createdAt,
            ).toLocaleDateString("ko-KR"),
            status:
              application.status === "APPROVED"
                ? "승인 완료"
                : application.status === "REJECTED"
                  ? "반려"
                  : "검토 중",
            statusKey:
              application.status === "APPROVED"
                ? "approved"
                : application.status === "REJECTED"
                  ? "rejected"
                  : "pending",
          })),
        );
      } catch (error) {
        console.error("마이 대시보드 데이터 조회 실패", error);
      }
    };

    fetchDashboardData();
  }, []);

  /*
    AI Tool 신청 현황 중
    검토 중인 신청 건수를 계산
  */
  const pendingApplicationCount = toolApplications.filter(
    (application) =>
      application.statusKey === "pending",
  ).length;

  /*
    공지사항 전체 보기 버튼을 클릭하면
    공지사항 전체 목록 페이지로 이동
  */
  const handleNoticeViewAll = () => {
    navigate("/notices");
  };

  /*
    아직 공지사항 상세 페이지가 없기 때문에
    공지사항 항목을 클릭해도 전체 목록으로 이동
  */
  const handleNoticeClick = () => {
    navigate("/notices");
  };

  /*
    AI Tool 신청 현황의 전체 보기 버튼을 클릭하면
    AI Tool 신청 페이지로 이동
  */
  const handleToolApplicationViewAll = () => {
    navigate("/ai-tools");
  };

  return (
    <div className="my-dashboard-page">
      {/* 페이지 제목과 월 선택 영역 */}
      <section className="dashboard-heading">
        <div>
          {/* 대시보드 본문 제목 */}
          <h2>마이 대시보드</h2>

          {/* 현재 선택된 조회 월 */}
          <p>
            당월: <strong>{selectedMonth}</strong>
          </p>
        </div>

        {/* 월 선택 버튼 목록 */}
        <div className="month-tab-list">
          {MONTH_OPTIONS.map((month) => (
            <button
              key={month}
              type="button"
              className={`month-tab ${
                selectedMonth === month ? "active" : ""
              }`}
              onClick={() => setSelectedMonth(month)}
            >
              {month}
            </button>
          ))}
        </div>
      </section>

      {/* 상단 요약 카드 */}
      <section className="dashboard-summary-grid">
        {/* 위험 이벤트 발생 카드 */}
        <article className="dashboard-summary-card">
          <div className="summary-icon summary-icon-warning">
            <AlertTriangle size={22} />
          </div>

          <div className="summary-content">
            <span className="summary-label">
              위험 이벤트 발생
            </span>

            <strong className="summary-value">
              {dashboardSummary.riskEventCount}건
            </strong>

            <small>
              MEDIUM 이상{" "}
              {dashboardSummary.mediumOrHigherCount}건
            </small>
          </div>
        </article>

        {/* AI 사용 횟수 카드 */}
        <article className="dashboard-summary-card">
          <div className="summary-icon summary-icon-primary">
            <Activity size={22} />
          </div>

          <div className="summary-content">
            <span className="summary-label">
              AI 사용 횟수
            </span>

            <strong className="summary-value">
              {dashboardSummary.totalUsageCount}회
            </strong>

            <small>
              전월 대비 +
              {dashboardSummary.usageIncrease}회
            </small>
          </div>
        </article>


        {/* 모델별 사용 비율 카드 */}
        <article className="dashboard-summary-card model-summary-card">
          <div className="model-card-content">
            <span className="summary-label">
              모델 배정 현황
            </span>

            <div className="model-allocation">
              {/*
                CSS의 conic-gradient를 사용해
                모델별 사용 비율을 도넛 그래프로 표시
              */}
              <div
                className="model-donut-chart"
                role="img"
                aria-label="모델별 사용 비율"
              />

              {/* 모델별 사용 비율 범례 */}
              <div className="model-legend">
                {modelAllocationData.map(
                  (model, index) => (
                    <div
                      key={model.modelName}
                      className="model-legend-item"
                    >
                      <span
                        className={`model-legend-dot model-color-${
                          index + 1
                        }`}
                      />

                      <span>
                        <strong>{model.modelName}</strong>{" "}
                        {model.percentage}%
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* 최근 7일 사용 추이와 공지사항 */}
      <section className="dashboard-main-grid">
        {/* 최근 7일 사용 추이 그래프 */}
        <section className="dashboard-panel trend-panel">
          <h3>최근 7일 사용 추이</h3>

          {/*
            ResponsiveContainer는 부모 요소의 크기에 맞게
            그래프 너비와 높이를 자동으로 조절
          */}
          <div className="trend-chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={usageTrendData}
                margin={{
                  top: 14,
                  right: 18,
                  left: -18,
                  bottom: 0,
                }}
              >
                {/* 그래프 배경 점선 */}
                <CartesianGrid
                  stroke="#e5eaf3"
                  strokeDasharray="4 4"
                />

                {/* 그래프 아래쪽 날짜 축 */}
                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "#6f7c91",
                    fontSize: 12,
                  }}
                  axisLine={{
                    stroke: "#b8c3d5",
                  }}
                  tickLine={false}
                />

                {/* 그래프 왼쪽 수치 축 */}
                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "#6f7c91",
                    fontSize: 12,
                  }}
                  axisLine={{
                    stroke: "#b8c3d5",
                  }}
                  tickLine={false}
                />

                {/* 마우스를 올렸을 때 상세 수치 표시 */}
                <Tooltip />

                {/* 그래프 아래 범례 */}
                <Legend />

                {/* AI 사용 횟수 그래프 */}
                <Line
                  type="monotone"
                  dataKey="usageCount"
                  name="AI 사용 횟수"
                  stroke="#2f6fed"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#ffffff",
                    stroke: "#2f6fed",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />

                {/* 위험 이벤트 발생 건수 그래프 */}
                <Line
                  type="monotone"
                  dataKey="riskCount"
                  name="위험 이벤트 발생 건수"
                  stroke="#ff4d5e"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#ffffff",
                    stroke: "#ff4d5e",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 오른쪽 공지사항 패널 */}
        <aside className="dashboard-panel notice-panel">
          {/* 공지사항 제목과 전체 보기 버튼 */}
          <div className="notice-panel-header">
            <div className="notice-panel-title">
              <Bell size={18} />
              <h3>공지사항</h3>
            </div>

            <button
              type="button"
              className="notice-view-all-button"
              onClick={handleNoticeViewAll}
            >
              전체 보기
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 최근 공지사항 목록 */}
          <div className="dashboard-notice-list">
            {notices.map((notice) => (
              <button
                key={notice.id}
                type="button"
                className="dashboard-notice-item"
                onClick={handleNoticeClick}
              >
                {/* 카테고리와 NEW 표시 */}
                <div className="notice-item-top">
                  <span className="notice-category">
                    {notice.category}
                  </span>

                  {notice.isNew && (
                    <span className="notice-new-badge">
                      NEW
                    </span>
                  )}
                </div>

                {/* 공지사항 제목 */}
                <strong className="notice-item-title">
                  {notice.title}
                </strong>

                {/* 공지사항 등록 날짜 */}
                <span className="notice-item-date">
                  {notice.createdAt}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </section>

      {/* 최근 사용 이력과 AI Tool 신청 현황

          두 영역이 dashboard-bottom-grid 안에
          함께 들어가 있어야 가로로 배치
      */}
      <section className="dashboard-bottom-grid">
        {/* 최근 사용 이력 */}
        <section className="dashboard-panel history-panel">
          {/* 제목과 전체 보기 버튼 */}
          <div className="panel-header">
            <h3>
              최근 사용 이력 ({recentUsageData.length}건)
            </h3>

            {/*
              전체 사용 이력 페이지는 아직 없기 때문에
              현재는 버튼 디자인만 표시
            */}
            <button
              type="button"
              className="view-all-button"
            >
              전체 보기
              <ArrowRight size={16} />
            </button>
          </div>

          {/* 작은 화면에서는 표를 가로 스크롤한다. */}
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>발생시각</th>
                  <th>사용도구(플랫폼)</th>
                  <th>탐지유형</th>
                  <th>위험등급</th>
                  <th>조치상태</th>
                </tr>
              </thead>

              <tbody>
                {recentUsageData.map((item) => (
                  <tr key={item.id}>
                    {/* AI 사용 시각 */}
                    <td>{item.occurredAt}</td>

                    {/* 사용한 AI Tool과 공급자 */}
                    <td>
                      <strong>{item.toolName}</strong>

                      <span className="provider-name">
                        {" "}
                        ({item.provider})
                      </span>
                    </td>

                    {/* 탐지 유형 */}
                    <td>{item.detectionType}</td>

                    {/* 위험 등급 */}
                    <td>
                      <span
                        className={getRiskClassName(
                          item.riskLevel,
                        )}
                      >
                        {item.riskLevel}
                      </span>
                    </td>

                    {/* 조치 상태 */}
                    <td>
                      <span
                        className={getActionClassName(
                          item.actionStatus,
                        )}
                      >
                        {item.actionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* AI Tool 신청 현황 */}
        <aside className="dashboard-panel tool-application-panel">
          {/* 신청 현황 제목과 전체 보기 버튼 */}
          <div className="tool-application-header">
            <div className="tool-application-title">
              {/* AI Tool 신청 현황 아이콘 */}
              <ClipboardList size={18} />

              <h3>AI Tool 신청 현황</h3>

              {/*
                검토 중인 신청이 있는 경우에만
                검토 중 건수를 표시
              */}
              {pendingApplicationCount > 0 && (
                <span className="tool-pending-count">
                  검토 중 {pendingApplicationCount}
                </span>
              )}
            </div>

            {/* AI Tool 신청 현황 전체 보기 */}
            <button
              type="button"
              className="tool-application-view-all"
              onClick={handleToolApplicationViewAll}
            >
              전체 보기
              <ArrowRight size={15} />
            </button>
          </div>

          {/* 최근 AI Tool 신청 목록 */}
          <div className="tool-application-list">
            {toolApplications.length > 0 ? (
              toolApplications.map((application) => (
                <article
                  key={application.id}
                  className="tool-application-item"
                >
                  {/* AI Tool 이름과 신청 상태 */}
                  <div className="tool-application-item-top">
                    <div className="tool-application-name">
                      <strong>
                        {application.toolName}
                      </strong>

                      <span>
                        {application.provider}
                      </span>
                    </div>

                    {/*
                      statusKey 값에 따라 다음 클래스가 만들어짐

                      approved → tool-status-approved
                      pending  → tool-status-pending
                      rejected → tool-status-rejected
                    */}
                    <span
                      className={`tool-application-status tool-status-${application.statusKey}`}
                    >
                      {application.status}
                    </span>
                  </div>

                  {/* AI Tool 신청 목적 */}
                  <p className="tool-application-purpose">
                    {application.purpose}
                  </p>

                  {/* 신청 날짜 */}
                  <span className="tool-application-date">
                    신청일 {application.requestedAt}
                  </span>
                </article>
              ))
            ) : (
              /* 신청 내역이 없을 때 표시할 내용 */
              <div className="tool-application-empty">
                <ClipboardList size={25} />

                <strong>
                  신청 내역이 없습니다.
                </strong>

                <p>
                  AI Tool을 신청하면 이곳에서 처리 상태를
                  확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

export default MyDashboardPage;
