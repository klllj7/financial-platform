import { useEffect, useState } from "react";

// 아이콘
import {
  Bot,
  ClipboardList,
  Plus,
  X,
} from "lucide-react";

import {
  createAiToolApplication,
  getAiToolApplications,
} from "../../api/aiToolApi";

// AI Tool 신청 페이지 전용 CSS
import "./AiToolsPage.css";

/*
  신청 상태에 맞는 CSS 클래스 이름을 반환

  approved → 초록색 승인 완료
  pending  → 주황색 검토 중
  rejected → 빨간색 반려
*/
const getApplicationStatusClassName = (statusKey) => {
  return `ai-tools-status ai-tools-status-${statusKey}`;
};

function AiToolsPage() {
  /*
    신청 현황 데이터가 배열이 아닌 경우에도
    화면 전체가 멈추지 않도록 빈 배열을 사용한다.
  */
  const [applications, setApplications] = useState([]);

  const [isApplyModalOpen, setIsApplyModalOpen] =
    useState(false);

  const [applicationForm, setApplicationForm] =
    useState({
      toolName: "",
      provider: "",
      purpose: "",
    });

  /* 백엔드 상태 코드를 기존 카드에서 사용하는 표시 형식으로 변환한다. */
  const formatApplication = (application) => ({
    id: application.id,
    toolName: application.toolName,
    provider: application.provider,
    purpose: application.purpose,
    requestedAt: new Date(application.createdAt).toLocaleDateString("ko-KR"),
    status: application.status === "APPROVED"
      ? "승인 완료"
      : application.status === "REJECTED"
        ? "반려"
        : "검토 중",
    statusKey: application.status === "APPROVED"
      ? "approved"
      : application.status === "REJECTED"
        ? "rejected"
        : "pending",
  });

  /* 페이지 진입 시 로그인 사용자의 신청 내역을 DB에서 조회한다. */
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getAiToolApplications();
        setApplications(
          Array.isArray(response.data)
            ? response.data.map(formatApplication)
            : [],
        );
      } catch (error) {
        console.error("AI Tool 신청 내역 조회 실패", error);
      }
    };
    fetchApplications();
  }, []);

  /*
    현재 검토 중인 신청 건수를 계산한다.
  */
  const pendingCount = applications.filter(
    (application) =>
      application.statusKey === "pending",
  ).length;

  /* AI Tool 신청 팝업을 연다. */
  const handleApplyButtonClick = () => {
    setIsApplyModalOpen(true);
  };

  const handleApplyModalClose = () => {
    setIsApplyModalOpen(false);
    setApplicationForm({
      toolName: "",
      provider: "",
      purpose: "",
    });
  };

  const handleApplicationFormChange = (event) => {
    const { name, value } = event.target;
    setApplicationForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await createAiToolApplication(applicationForm);
      setApplications((currentApplications) => [
        formatApplication(response.data),
        ...currentApplications,
      ]);
      handleApplyModalClose();
    } catch (error) {
      alert(error.response?.data?.error?.message || "AI Tool 신청에 실패했습니다.");
    }
  };

  return (
    <div className="ai-tools-page">
      {/* 페이지 제목 영역 */}
      <header className="ai-tools-heading">
        <div>
          {/* 페이지 제목 */}
          <h2>AI Tool 신청</h2>

          {/* 페이지 기능 설명 */}
          <p>
            신청한 AI Tool의 처리 상태를 확인하고,
            새로운 사용 권한을 신청할 수 있습니다.
          </p>
        </div>

        {/* 새로운 AI Tool 신청 버튼 */}
        <button
          type="button"
          className="ai-tool-apply-button"
          onClick={handleApplyButtonClick}
        >
          <Plus size={17} />
          AI Tool 신청하기
        </button>
      </header>

      {/* 페이지 안내 카드 */}
      <section className="ai-tools-guide-card">
        {/* 안내 카드 아이콘 */}
        <div className="ai-tools-guide-icon">
          <Bot size={24} />
        </div>

        {/* 안내 카드 내용 */}
        <div className="ai-tools-guide-content">
          <strong>
            승인된 AI Tool만 업무에 사용할 수 있습니다.
          </strong>

          <p>
            신청한 AI Tool은 담당자의 검토 후 사용 권한이
            부여됩니다. 검토 결과는 이 페이지와 마이
            대시보드에서 확인할 수 있습니다.
          </p>
        </div>
      </section>

      {/* 내 AI Tool 신청 현황 */}
      <section className="ai-tools-section">
        {/* 신청 현황 제목 영역 */}
        <div className="ai-tools-section-header">
          <div className="ai-tools-section-title">
            <div className="ai-tools-section-title-row">
              <ClipboardList size={19} />

              <h3>내 신청 현황</h3>

              {/*
                검토 중인 신청이 있는 경우에만
                검토 중 건수를 표시한다.
              */}
              {pendingCount > 0 && (
                <span className="ai-tools-pending-count">
                  검토 중 {pendingCount}
                </span>
              )}
            </div>

            <p>
              내가 신청한 AI Tool의 처리 상태를 확인합니다.
            </p>
          </div>

          {/* 전체 신청 건수 */}
          <span className="ai-tools-count">
            총 {applications.length}건
          </span>
        </div>

        {/* 신청 현황 목록 */}
        {applications.length > 0 ? (
          <div className="ai-tools-application-list">
            {applications.map((application) => (
              <article
                key={application.id}
                className="ai-tools-application-card"
              >
                {/* AI Tool 이름과 신청 상태 */}
                <div className="ai-tools-application-top">
                  <div className="ai-tools-application-name">
                    <strong>
                      {application.toolName}
                    </strong>

                    <span>
                      {application.provider}
                    </span>
                  </div>

                  {/* 승인 완료, 검토 중, 반려 배지 */}
                  <span
                    className={getApplicationStatusClassName(
                      application.statusKey,
                    )}
                  >
                    {application.status}
                  </span>
                </div>

                {/* 신청 목적 */}
                <div className="ai-tools-application-info">
                  <span>사용 목적</span>

                  <p>{application.purpose}</p>
                </div>

                {/* 신청 날짜 */}
                <div className="ai-tools-application-footer">
                  <span>
                    신청일 {application.requestedAt}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* 신청 내역이 없는 경우 표시할 화면 */
          <div className="ai-tools-empty">
            <ClipboardList size={30} />

            <strong>
              표시할 신청 내역이 없습니다.
            </strong>

            <p>
              AI Tool을 신청하면 검토 중, 승인 완료,
              반려 상태가 이곳에 표시됩니다.
            </p>
          </div>
        )}
      </section>

      {isApplyModalOpen && (
        <div
          className="ai-tool-modal-backdrop"
          role="presentation"
          onMouseDown={handleApplyModalClose}
        >
          <section
            className="ai-tool-apply-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-tool-apply-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="ai-tool-modal-header">
              <div>
                <span className="ai-tool-modal-icon">
                  <Bot size={20} />
                </span>

                <div>
                  <h3 id="ai-tool-apply-modal-title">
                    AI Tool 신청하기
                  </h3>
                  <p>
                    업무에 사용할 AI Tool 정보를 입력해 주세요.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="팝업 닫기"
                onClick={handleApplyModalClose}
              >
                <X size={19} />
              </button>
            </header>

            <form
              className="ai-tool-apply-form"
              onSubmit={handleApplicationSubmit}
            >
              <label>
                <span>AI Tool 이름</span>
                <input
                  name="toolName"
                  value={applicationForm.toolName}
                  onChange={handleApplicationFormChange}
                  placeholder="예: ChatGPT Enterprise"
                  required
                />
              </label>

              <label>
                <span>공급사</span>
                <input
                  name="provider"
                  value={applicationForm.provider}
                  onChange={handleApplicationFormChange}
                  placeholder="예: OpenAI"
                  required
                />
              </label>

              <label className="ai-tool-purpose-field">
                <span>사용 목적</span>
                <textarea
                  name="purpose"
                  value={applicationForm.purpose}
                  onChange={handleApplicationFormChange}
                  placeholder="사용할 업무와 필요한 이유를 구체적으로 작성해 주세요."
                  rows={5}
                  required
                />
                <small>
                  고객정보나 비밀번호 등 민감정보는 입력하지 마세요.
                </small>
              </label>

              <footer className="ai-tool-modal-footer">
                <button
                  type="button"
                  className="ai-tool-modal-cancel"
                  onClick={handleApplyModalClose}
                >
                  취소
                </button>

                <button
                  type="submit"
                  className="ai-tool-modal-submit"
                >
                  신청하기
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default AiToolsPage;
