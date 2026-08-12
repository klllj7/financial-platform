import { useEffect, useMemo, useState } from "react";

// 아이콘
import {
  AlertCircle,
  Bot,
  ClipboardList,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  createAiToolApplication,
  getAllAiToolApplications,
  getAiToolApplications,
  getBedrockModelCatalog,
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
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const roleCode = user?.role?.code || user?.role || "EMPLOYEE";
  const canViewAllApplications = [
    "EMPLOYEE",
    "COMPLIANCE_MANAGER",
    "ADMIN",
  ].includes(roleCode);

  /*
    신청 현황 데이터가 배열이 아닌 경우에도
    화면 전체가 멈추지 않도록 빈 배열을 사용한다.
  */
  const [applications, setApplications] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [allApplicationsKeyword, setAllApplicationsKeyword] = useState("");
  const [allApplicationsStatus, setAllApplicationsStatus] = useState("ALL");
  const [isAllApplicationsLoading, setIsAllApplicationsLoading] =
    useState(canViewAllApplications);

  const [isApplyModalOpen, setIsApplyModalOpen] =
    useState(false);

  // 신청 가능한 Bedrock 서버리스 모델 카탈로그다.
  const [bedrockModels, setBedrockModels] = useState([]);
  const [isBedrockModelsLoading, setIsBedrockModelsLoading] = useState(false);
  const [bedrockModelsError, setBedrockModelsError] = useState("");

  // 반려 카드를 클릭했을 때 상세 팝업에 표시할 신청 건이다.
  const [selectedRejectedApplication, setSelectedRejectedApplication] =
    useState(null);

  const [applicationForm, setApplicationForm] =
    useState({
      bedrockModelId: "",
      bedrockModelName: "",
      provider: "",
      purpose: "",
    });

  /* 백엔드 상태 코드를 기존 카드에서 사용하는 표시 형식으로 변환한다. */
  const formatApplication = (application) => ({
    id: application.id,
    toolName: application.toolName,
    provider: application.provider,
    purpose: application.purpose,
    applicantName: application.applicantName,
    departmentName: application.departmentName,
    reviewComment: application.reviewComment,
    reviewedAt: application.reviewedAt
      ? new Date(application.reviewedAt).toLocaleString("ko-KR")
      : null,
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

  /* 모든 역할은 내 신청 아래에서 조직의 전체 신청 현황을 확인한다. */
  useEffect(() => {
    if (!canViewAllApplications) return;

    const fetchAllApplications = async () => {
      try {
        const response = await getAllAiToolApplications();
        setAllApplications(
          Array.isArray(response.data)
            ? response.data.map(formatApplication)
            : [],
        );
      } catch (error) {
        console.error("전체 AI Tool 신청 내역 조회 실패", error);
      } finally {
        setIsAllApplicationsLoading(false);
      }
    };

    fetchAllApplications();
  }, [canViewAllApplications]);

  /*
    현재 검토 중인 신청 건수를 계산한다.
  */
  const pendingCount = applications.filter(
    (application) =>
      application.statusKey === "pending",
  ).length;
  const filteredAllApplications = useMemo(() => {
    const keyword = allApplicationsKeyword.trim().toLocaleLowerCase("ko-KR");
    return allApplications.filter((application) => {
      const matchesStatus =
        allApplicationsStatus === "ALL" ||
        application.statusKey === allApplicationsStatus;
      const matchesKeyword =
        !keyword ||
        [
          application.toolName,
          application.provider,
          application.status,
        ].some((value) =>
          String(value || "").toLocaleLowerCase("ko-KR").includes(keyword),
        );

      return matchesStatus && matchesKeyword;
    });
  }, [
    allApplications,
    allApplicationsKeyword,
    allApplicationsStatus,
  ]);

  /* AI Tool 신청 팝업을 열고, Bedrock 서버리스 모델 카탈로그를 불러온다. */
  const handleApplyButtonClick = () => {
    setIsApplyModalOpen(true);
    setIsBedrockModelsLoading(true);
    setBedrockModelsError("");
    getBedrockModelCatalog()
      .then((response) => {
        setBedrockModels(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        console.error("Bedrock 모델 카탈로그 조회 실패", error);
        setBedrockModelsError(
          error.response?.data?.error?.message ||
            "신청 가능한 모델 목록을 불러오지 못했습니다.",
        );
      })
      .finally(() => setIsBedrockModelsLoading(false));
  };

  const handleApplyModalClose = () => {
    setIsApplyModalOpen(false);
    setApplicationForm({
      bedrockModelId: "",
      bedrockModelName: "",
      provider: "",
      purpose: "",
    });
  };

  /* 드롭다운에서 모델을 선택하면 모델ID/이름/공급사를 한 번에 채운다. */
  const handleModelSelectChange = (event) => {
    const selectedModelId = event.target.value;
    const selectedModel = bedrockModels.find(
      (model) => model.modelId === selectedModelId,
    );
    setApplicationForm((currentForm) => ({
      ...currentForm,
      bedrockModelId: selectedModel?.modelId || "",
      bedrockModelName: selectedModel?.modelName || "",
      provider: selectedModel?.providerName || "",
    }));
  };

  const handlePurposeChange = (event) => {
    const { value } = event.target;
    setApplicationForm((currentForm) => ({
      ...currentForm,
      purpose: value,
    }));
  };

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await createAiToolApplication(applicationForm);
      const createdApplication = formatApplication(response.data);
      setApplications((currentApplications) => [
        createdApplication,
        ...currentApplications,
      ]);
      if (canViewAllApplications) {
        setAllApplications((currentApplications) => [
          createdApplication,
          ...currentApplications,
        ]);
      }
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
                className={`ai-tools-application-card ${
                  application.statusKey === "rejected"
                    ? "is-clickable"
                    : ""
                }`}
                role={
                  application.statusKey === "rejected"
                    ? "button"
                    : undefined
                }
                tabIndex={
                  application.statusKey === "rejected" ? 0 : undefined
                }
                onClick={() => {
                  if (application.statusKey === "rejected") {
                    setSelectedRejectedApplication(application);
                  }
                }}
                onKeyDown={(event) => {
                  if (
                    application.statusKey === "rejected" &&
                    ["Enter", " "].includes(event.key)
                  ) {
                    event.preventDefault();
                    setSelectedRejectedApplication(application);
                  }
                }}
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
                  {application.statusKey === "rejected" && (
                    <strong>카드를 눌러 반려 사유 확인</strong>
                  )}
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

      {canViewAllApplications && (
        <section className="ai-tools-section ai-tools-all-section">
          <div className="ai-tools-section-header">
            <div className="ai-tools-section-title">
              <div className="ai-tools-section-title-row">
                <ClipboardList size={19} />
                <h3>전체 신청 목록</h3>
              </div>
              <p>
                전사 임직원이 신청한 AI Tool과 현재 처리 상태를 확인합니다.
              </p>
            </div>
            <div className="ai-tools-all-controls">
              <label className="ai-tools-all-search">
                <Search size={15} />
                <input
                  type="search"
                  value={allApplicationsKeyword}
                  onChange={(event) =>
                    setAllApplicationsKeyword(event.target.value)
                  }
                  placeholder="모델, 공급사, 처리 상태 검색"
                  aria-label="전체 AI Tool 신청 목록 검색"
                />
              </label>
              <select
                className="ai-tools-all-status-filter"
                value={allApplicationsStatus}
                onChange={(event) =>
                  setAllApplicationsStatus(event.target.value)
                }
                aria-label="전체 신청 처리 상태 필터"
              >
                <option value="ALL">전체 상태</option>
                <option value="pending">검토 중</option>
                <option value="approved">승인 완료</option>
                <option value="rejected">반려</option>
              </select>
              <span className="ai-tools-count">
                {allApplicationsKeyword.trim() ||
                allApplicationsStatus !== "ALL"
                  ? `${filteredAllApplications.length} / ${allApplications.length}건`
                  : `총 ${allApplications.length}건`}
              </span>
            </div>
          </div>

          {filteredAllApplications.length > 0 ? (
            <div className="ai-tools-all-table-wrapper">
              <table className="ai-tools-all-table">
                <thead>
                  <tr>
                    <th>AI Tool</th>
                    <th>공급사</th>
                    <th>신청일</th>
                    <th>처리 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllApplications.map((application) => (
                    <tr key={application.id}>
                      <td><strong>{application.toolName}</strong></td>
                      <td>{application.provider}</td>
                      <td>{application.requestedAt}</td>
                      <td>
                        <span
                          className={getApplicationStatusClassName(
                            application.statusKey,
                          )}
                        >
                          {application.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ai-tools-empty">
              <ClipboardList size={30} />
              <strong>
                {isAllApplicationsLoading
                  ? "전체 신청 내역을 불러오는 중입니다."
                  : allApplicationsKeyword.trim() ||
                      allApplicationsStatus !== "ALL"
                    ? "검색 조건에 맞는 신청 내역이 없습니다."
                    : "전체 신청 내역이 없습니다."}
              </strong>
            </div>
          )}
        </section>
      )}

      {/* 반려된 신청 카드를 선택하면 관리자가 작성한 반려 사유를 보여준다. */}
      {selectedRejectedApplication && (
        <div
          className="ai-tool-modal-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedRejectedApplication(null)}
        >
          <section
            className="ai-tool-apply-modal ai-tool-rejection-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-tool-rejection-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="ai-tool-modal-header rejection">
              <div>
                <span className="ai-tool-modal-icon">
                  <AlertCircle size={20} />
                </span>
                <div>
                  <h3 id="ai-tool-rejection-modal-title">
                    AI Tool 신청 반려 사유
                  </h3>
                  <p>{selectedRejectedApplication.toolName}</p>
                </div>
              </div>

              <button
                type="button"
                aria-label="반려 사유 팝업 닫기"
                onClick={() => setSelectedRejectedApplication(null)}
              >
                <X size={19} />
              </button>
            </header>

            <div className="ai-tool-rejection-detail">
              <dl>
                <div>
                  <dt>AI Tool</dt>
                  <dd>{selectedRejectedApplication.toolName}</dd>
                </div>
                <div>
                  <dt>공급사</dt>
                  <dd>{selectedRejectedApplication.provider}</dd>
                </div>
                <div className="wide">
                  <dt>신청 목적</dt>
                  <dd>{selectedRejectedApplication.purpose}</dd>
                </div>
                <div className="wide rejection-reason">
                  <dt>반려 사유</dt>
                  <dd>
                    {selectedRejectedApplication.reviewComment ||
                      "등록된 반려 사유가 없습니다."}
                  </dd>
                </div>
              </dl>

              {selectedRejectedApplication.reviewedAt && (
                <p>
                  처리일 {selectedRejectedApplication.reviewedAt}
                </p>
              )}
            </div>

            <footer className="ai-tool-rejection-footer">
              <button
                type="button"
                onClick={() => setSelectedRejectedApplication(null)}
              >
                확인
              </button>
            </footer>
          </section>
        </div>
      )}

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
                <span>신청할 모델 (Bedrock 서버리스)</span>
                <select
                  name="bedrockModelId"
                  value={applicationForm.bedrockModelId}
                  onChange={handleModelSelectChange}
                  required
                  disabled={isBedrockModelsLoading || bedrockModels.length === 0}
                >
                  <option value="" disabled>
                    {isBedrockModelsLoading
                      ? "모델 목록을 불러오는 중..."
                      : "모델을 선택해 주세요"}
                  </option>
                  {bedrockModels.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.providerName} · {model.modelName}
                    </option>
                  ))}
                </select>
                {bedrockModelsError && (
                  <small className="ai-tool-model-error">
                    {bedrockModelsError}
                  </small>
                )}
              </label>

              <label className="ai-tool-purpose-field">
                <span>사용 목적</span>
                <textarea
                  name="purpose"
                  value={applicationForm.purpose}
                  onChange={handlePurposeChange}
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
                  disabled={!applicationForm.bedrockModelId}
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
