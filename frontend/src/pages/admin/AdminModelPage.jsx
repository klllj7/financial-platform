import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle, XCircle } from "lucide-react";

import {
  getAiToolApplications,
  reviewAiToolApplication,
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
  const approvedCount = applications.filter(
    (item) => item.status === "APPROVED",
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
          <span>승인완료</span>
          <strong>{approvedCount}</strong>
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
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && filteredApplications.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-model-empty-message">
                    접수된 AI Tool 신청 내역이 없습니다.
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan="7" className="admin-model-empty-message">
                    신청 내역을 불러오는 중입니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
