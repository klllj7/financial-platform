// 대시보드 API 조회 시점을 관리하기 위해 사용
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

/* 공지사항과 AI Tool 신청 현황을 백엔드에서 조회한다. */
import { getNotices } from "../../api/noticeApi";
import { getAiToolApplications } from "../../api/aiToolApi";
import { markNoticeAsRead } from "../../utils/noticeReadState";
import {
  getMyDashboardModels,
  getMyDashboardRecent,
  getMyDashboardSummary,
} from "../../api/dashboardApi";

/* 대시보드 전용 CSS */
import "./MyDashBoardPage.css";

const EMPTY_SUMMARY = {
  riskEventCount: 0,
  mediumOrHigherCount: 0,
  usageCount: 0,
  previousMonthDifference: 0,
  totalTokens: 0,
  totalCostKrw: 0,
};

const MODEL_COLORS = ["#2f6fed", "#7a5af8", "#30b795", "#f5a623"];

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

  /* 대시보드에는 서버에서 조회한 최신 데이터 3건만 저장한다. */
  const [notices, setNotices] = useState([]);
  const [toolApplications, setToolApplications] =
    useState([]);
  const [dashboardSummary, setDashboardSummary] =
    useState(EMPTY_SUMMARY);
  const [modelAllocationData, setModelAllocationData] =
    useState([]);
  const [recentUsageData, setRecentUsageData] = useState([]);

  /*
    정해진 개인 대시보드 API 명세에 따라 요약·추이·모델·최근 이력을 조회한다.
    월간 요약과 모델 비율은 현재 월을 기준으로 조회한다.
  */
  useEffect(() => {
    const fetchPersonalDashboard = async () => {
      const today = new Date();
      const month = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
      ).padStart(2, "0")}`;

      try {
        const [summaryResponse, modelsResponse, recentResponse] =
          await Promise.all([
            getMyDashboardSummary(month),
            getMyDashboardModels(month),
            getMyDashboardRecent(5),
          ]);

        setDashboardSummary(summaryResponse.data || EMPTY_SUMMARY);
        setModelAllocationData(
          Array.isArray(modelsResponse.data?.models)
            ? modelsResponse.data.models
            : [],
        );
        setRecentUsageData(
          Array.isArray(recentResponse.data?.items)
            ? recentResponse.data.items.map((item) => ({
              ...item,
              occurredAt: new Date(item.occurredAt).toLocaleString("ko-KR"),
            }))
            : [],
        );
      } catch (error) {
        console.error("개인 대시보드 조회 실패", error);
        setDashboardSummary(EMPTY_SUMMARY);
        setModelAllocationData([]);
        setRecentUsageData([]);
      }
    };

    fetchPersonalDashboard();
  }, []);

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

        const normalizedNotices = noticeData.map((notice) => ({
          ...notice,
          isPinned: Boolean(notice.isPinned ?? notice.is_pinned),
        }));

        setNotices(
          normalizedNotices
            .sort((firstNotice, secondNotice) => {
              if (
                Boolean(firstNotice.isPinned) !==
                Boolean(secondNotice.isPinned)
              ) {
                return Number(Boolean(secondNotice.isPinned)) -
                  Number(Boolean(firstNotice.isPinned));
              }

              return new Date(secondNotice.createdAt).getTime() -
                new Date(firstNotice.createdAt).getTime();
            })
            .slice(0, 3)
            .map((notice) => {
            const createdAt = new Date(notice.createdAt);

            return {
              id: notice.id,
              category: notice.category,
              title: notice.title,
              createdAt: createdAt.toLocaleDateString("ko-KR"),
              isPinned: notice.isPinned,
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
  const handleNoticeClick = (noticeId) => {
    markNoticeAsRead(noticeId);
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
      {/* 페이지 제목 */}
      <section className="dashboard-heading">
        <h2>마이 대시보드</h2>
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
              {dashboardSummary.usageCount}회
            </strong>

            <small>
              전월 대비{" "}
              {dashboardSummary.previousMonthDifference >= 0 ? "+" : ""}
              {dashboardSummary.previousMonthDifference}회
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
                style={{
                  background: modelAllocationData.length
                    ? `conic-gradient(${modelAllocationData
                      .reduce(
                        (result, model, index) => {
                          const start = result.total;
                          const end = start + model.ratio;
                          result.parts.push(
                            `${MODEL_COLORS[index % MODEL_COLORS.length]} ${start}% ${end}%`,
                          );
                          result.total = end;
                          return result;
                        },
                        { parts: [], total: 0 },
                      )
                      .parts.join(", ")})`
                    : "#e5eaf3",
                }}
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
                        {model.ratio}%
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* 최근 사용 이력과 공지사항 */}
      <section className="dashboard-main-grid">
        <section className="dashboard-panel history-panel dashboard-main-history">
          <div className="panel-header">
            <h3>최근 사용 이력 ({recentUsageData.length}건)</h3>
            <button
              type="button"
              className="view-all-button"
              onClick={() => navigate("/usage-history")}
            >
              전체 보기
              <ArrowRight size={16} />
            </button>
          </div>

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
                    <td>{item.occurredAt}</td>
                    <td>
                      <strong>{item.toolName}</strong>
                      <span className="provider-name">
                        {" "}({item.provider})
                      </span>
                    </td>
                    <td>{item.detectionType}</td>
                    <td>
                      <span className={getRiskClassName(item.riskLevel)}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td>
                      <span className={getActionClassName(item.actionStatus)}>
                        {item.actionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                className={`dashboard-notice-item ${
                  notice.isPinned ? "is-pinned" : ""
                }`}
                onClick={() => handleNoticeClick(notice.id)}
              >
                <div className="dashboard-notice-item-main">
                  <span className="notice-category">
                    {notice.category}
                  </span>

                  <strong className="notice-item-title">
                    {notice.title}
                  </strong>
                </div>

                <span className="notice-item-date">
                  {notice.createdAt}
                </span>
              </button>
            ))}
          </div>
        </aside>

      {/* AI Tool 신청 현황 */}
      <section className="dashboard-bottom-grid">
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
      </section>
    </div>
  );
}

export default MyDashboardPage;
