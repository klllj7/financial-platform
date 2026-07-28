import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  createManagedAiTool,
  deleteAiToolApplication,
  getAiToolApplications,
  reviewAiToolApplication,
  updateAiToolActiveStatus,
} from "../../api/aiToolApi";
import "./AdminModelPage.css";

const STATUS_LABELS = {
  PENDING: "승인대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("ko-KR") : "-";

function AdminModelPage() {
  // 임직원이 /api/ai-tool로 등록한 실제 신청 목록을 보관한다.
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    toolName: "",
    provider: "",
    purpose: "",
  });

  // 반려 사유를 입력받을 팝업 상태다.
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // 관리자 페이지 진입 시 전체 AI Tool 신청 내역을 조회한다.
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getAiToolApplications();
        setApplications(
          Array.isArray(response.data) ? response.data : [],
        );
      } catch (error) {
        console.error("AI Tool 신청 목록 조회 실패", error);
        setErrorMessage(
          error.response?.data?.error?.message ||
            "AI Tool 신청 목록을 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const providers = useMemo(
    () =>
      [...new Set(applications.map((item) => item.provider).filter(Boolean))],
    [applications],
  );

  // 승인 상태와 공급사 조건을 모두 만족하는 신청만 테이블에 표시한다.
  const filteredApplications = useMemo(
    () =>
      applications.filter(
        (item) =>
          (statusFilter === "ALL" || item.status === statusFilter) &&
          (providerFilter === "ALL" || item.provider === providerFilter),
      ),
    [applications, providerFilter, statusFilter],
  );

  const pendingCount = applications.filter(
    (item) => item.status === "PENDING",
  ).length;
  const activeCount = applications.filter(
    (item) => item.status === "APPROVED" && item.isActive !== false,
  ).length;

  // 승인·반려 API 처리 결과를 목록에도 즉시 반영한다.
  const submitReview = async (application, status, reviewComment) => {
    if (reviewingId) return;

    setReviewingId(application.id);
    setErrorMessage("");

    try {
      const response = await reviewAiToolApplication(application.id, {
        status,
        reviewComment,
      });

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? response.data : item,
        ),
      );
      setRejectTarget(null);
      setRejectReason("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error?.message ||
          "신청 처리 결과를 저장하지 못했습니다.",
      );
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = (event) => {
    event.preventDefault();

    if (!rejectReason.trim()) {
      setErrorMessage("반려 사유를 입력해 주세요.");
      return;
    }

    submitReview(rejectTarget, "REJECTED", rejectReason.trim());
  };

  const handleActiveToggle = async (application) => {
    if (togglingId || application.status !== "APPROVED") return;

    setTogglingId(application.id);
    setErrorMessage("");

    try {
      const response = await updateAiToolActiveStatus(
        application.id,
        application.isActive === false,
      );
      setApplications((current) =>
        current.map((item) =>
          item.id === application.id ? response.data : item,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error?.message ||
          "AI Tool 활성 상태를 변경하지 못했습니다.",
      );
    } finally {
      setTogglingId(null);
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddForm({ toolName: "", provider: "", purpose: "" });
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    if (isAdding) return;

    setIsAdding(true);
    setErrorMessage("");

    try {
      const response = await createManagedAiTool(addForm);
      setApplications((current) => [response.data, ...current]);
      closeAddModal();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error?.message ||
          "AI 모델을 추가하지 못했습니다.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deletingId) return;

    setDeletingId(deleteTarget.id);
    setErrorMessage("");

    try {
      await deleteAiToolApplication(deleteTarget.id);
      setApplications((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error?.message ||
          "AI Tool을 삭제하지 못했습니다.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="admin-model-page">
      <div className="admin-model-header">
        <div>
          <p className="admin-model-eyebrow">Admin Console</p>
          <h2>AI 모델 관리</h2>
          <p>
            임직원이 신청한 AI Tool을 확인하고 사용 승인 또는 반려를
            처리합니다.
          </p>
        </div>
        <button
          type="button"
          className="admin-model-add-button"
          onClick={() => {
            setErrorMessage("");
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={16} />
          AI 모델 추가
        </button>
      </div>

      <div className="admin-model-summary-grid">
        <div className="admin-model-summary-card">
          <span>전체 신청</span>
          <strong>{applications.length}</strong>
        </div>
        <div className="admin-model-summary-card">
          <span>승인대기</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="admin-model-summary-card">
          <span>활성 모델</span>
          <strong>{activeCount}</strong>
        </div>
      </div>

      <div className="admin-model-filter-card">
        <div className="admin-model-filter-group">
          <label htmlFor="statusFilter">승인상태</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">승인대기</option>
            <option value="APPROVED">승인완료</option>
            <option value="REJECTED">반려</option>
          </select>
        </div>

        <div className="admin-model-filter-group">
          <label htmlFor="providerFilter">공급사</label>
          <select
            id="providerFilter"
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
          >
            <option value="ALL">전체 공급사</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-model-filter-result">
          총 <strong>{filteredApplications.length}</strong>건
        </div>
      </div>

      {errorMessage && (
        <p className="admin-model-error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="admin-model-table-card">
        <div className="admin-model-table-header">
          <h3>AI Tool 신청 현황</h3>
          <span>승인된 Tool은 신청 임직원의 AI 사용하기에 표시됩니다.</span>
        </div>

        <div className="admin-model-table-wrapper">
          <table className="admin-model-table">
            <thead>
              <tr>
                <th>AI Tool</th>
                <th>공급사</th>
                <th>신청자</th>
                <th>부서</th>
                <th>승인상태</th>
                <th>신청일시</th>
                <th>활성상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <div className="admin-model-name-cell">
                      <div className="admin-model-icon">
                        <Bot size={17} />
                      </div>
                      <div>
                        <strong>{application.toolName}</strong>
                        <span>{application.purpose}</span>
                      </div>
                    </div>
                  </td>
                  <td>{application.provider}</td>
                  <td>{application.applicantName}</td>
                  <td>{application.departmentName || "-"}</td>
                  <td>
                    <span
                      className={`admin-model-status-badge ${application.status}`}
                    >
                      {STATUS_LABELS[application.status] || application.status}
                    </span>
                  </td>
                  <td>{formatDate(application.createdAt)}</td>
                  <td>
                    <div className="admin-model-toggle-cell">
                      <button
                        type="button"
                        className={`admin-model-toggle ${
                          application.isActive !== false ? "active" : ""
                        }`}
                        role="switch"
                        aria-checked={application.isActive !== false}
                        aria-label={`${application.toolName} ${
                          application.isActive !== false
                            ? "비활성화"
                            : "활성화"
                        }`}
                        onClick={() => handleActiveToggle(application)}
                        disabled={
                          application.status !== "APPROVED" ||
                          togglingId === application.id
                        }
                      >
                        <span />
                      </button>
                      <small>
                        {application.status !== "APPROVED"
                          ? "-"
                          : application.isActive !== false
                            ? "활성"
                            : "비활성"}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="admin-model-action-buttons">
                      <button
                        type="button"
                        className="admin-model-approve-button"
                        onClick={() =>
                          submitReview(application, "APPROVED", "승인 처리")
                        }
                        disabled={
                          application.status !== "PENDING" ||
                          reviewingId === application.id
                        }
                      >
                        <CheckCircle size={14} />
                        승인
                      </button>
                      <button
                        type="button"
                        className="admin-model-reject-button"
                        onClick={() => {
                          setRejectTarget(application);
                          setRejectReason("");
                          setErrorMessage("");
                        }}
                        disabled={
                          application.status !== "PENDING" ||
                          reviewingId === application.id
                        }
                      >
                        <XCircle size={14} />
                        반려
                      </button>
                      <button
                        type="button"
                        className="admin-model-delete-button"
                        onClick={() => {
                          setErrorMessage("");
                          setDeleteTarget(application);
                        }}
                        disabled={deletingId === application.id}
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && filteredApplications.length === 0 && (
                <tr>
                  <td colSpan="8" className="admin-model-empty-message">
                    접수된 AI Tool 신청 내역이 없습니다.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan="8" className="admin-model-empty-message">
                    신청 내역을 불러오는 중입니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div
          className="admin-model-modal-backdrop"
          role="presentation"
          onMouseDown={closeAddModal}
        >
          <div
            className="admin-model-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-model-add-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-model-modal-header">
              <div>
                <p>Admin Model Registry</p>
                <h3 id="admin-model-add-title">AI 모델 직접 추가</h3>
              </div>
              <button
                type="button"
                className="admin-model-modal-close"
                onClick={closeAddModal}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="admin-model-modal-body">
                <div className="admin-model-form-group">
                  <label htmlFor="managedToolName">모델 이름</label>
                  <input
                    id="managedToolName"
                    value={addForm.toolName}
                    onChange={(event) =>
                      setAddForm((current) => ({
                        ...current,
                        toolName: event.target.value,
                      }))
                    }
                    placeholder="예: GPT-5"
                    required
                  />
                </div>
                <div className="admin-model-form-group">
                  <label htmlFor="managedProvider">공급사</label>
                  <input
                    id="managedProvider"
                    value={addForm.provider}
                    onChange={(event) =>
                      setAddForm((current) => ({
                        ...current,
                        provider: event.target.value,
                      }))
                    }
                    placeholder="예: OpenAI"
                    required
                  />
                </div>
                <div className="admin-model-form-group">
                  <label htmlFor="managedPurpose">모델 설명</label>
                  <textarea
                    id="managedPurpose"
                    value={addForm.purpose}
                    onChange={(event) =>
                      setAddForm((current) => ({
                        ...current,
                        purpose: event.target.value,
                      }))
                    }
                    placeholder="사용 용도와 모델 특징을 입력해 주세요."
                    required
                  />
                </div>
              </div>
              <div className="admin-model-modal-footer">
                <button
                  type="button"
                  className="admin-model-cancel-button"
                  onClick={closeAddModal}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="admin-model-save-button"
                  disabled={isAdding}
                >
                  {isAdding ? "추가 중..." : "추가하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="admin-model-modal-backdrop"
          role="presentation"
          onMouseDown={() => setDeleteTarget(null)}
        >
          <div
            className="admin-model-modal admin-model-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="admin-model-delete-title"
            aria-describedby="admin-model-delete-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-model-modal-header">
              <div>
                <p>AI Tool 삭제</p>
                <h3 id="admin-model-delete-title">
                  {deleteTarget.toolName}
                </h3>
              </div>
              <button
                type="button"
                className="admin-model-modal-close"
                onClick={() => setDeleteTarget(null)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="admin-model-delete-body">
              <span><Trash2 size={22} /></span>
              <div>
                <strong>정말 삭제하시겠습니까?</strong>
                <p id="admin-model-delete-description">
                  삭제하면 신청 내역과 모델 목록에서 제거되며 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <div className="admin-model-modal-footer">
              <button
                type="button"
                className="admin-model-cancel-button"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
              >
                취소
              </button>
              <button
                type="button"
                className="admin-model-confirm-delete-button"
                onClick={handleDeleteConfirm}
                disabled={deletingId === deleteTarget.id}
              >
                {deletingId === deleteTarget.id
                  ? "삭제 중..."
                  : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="admin-model-modal-backdrop">
          <div className="admin-model-modal">
            <div className="admin-model-modal-header">
              <div>
                <p>AI Tool 신청 반려</p>
                <h3>{rejectTarget.toolName}</h3>
              </div>
              <button
                type="button"
                className="admin-model-modal-close"
                onClick={() => setRejectTarget(null)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleReject}>
              <div className="admin-model-modal-body">
                <div className="admin-model-form-group">
                  <label htmlFor="rejectReason">반려 사유</label>
                  <textarea
                    id="rejectReason"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="신청자에게 안내할 반려 사유를 입력해 주세요."
                  />
                </div>
              </div>
              <div className="admin-model-modal-footer">
                <button
                  type="button"
                  className="admin-model-cancel-button"
                  onClick={() => setRejectTarget(null)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="admin-model-save-button"
                  disabled={reviewingId === rejectTarget.id}
                >
                  반려 처리
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminModelPage;
