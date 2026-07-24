import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Boxes, CheckCircle2, Clock3, Eye, Search, XCircle } from "lucide-react";

import {
  getAiToolApplications,
  reviewAiToolApplication,
} from "../../../api/aiToolApi";
import "./ComplianceModelApplicationsPage.css";

const TYPE_FILTERS = ["전체", "AI Tool", "AI 모델"];
const STATUS_FILTERS = ["전체", "검토 대기", "검토 중", "승인", "반려"];

function ComplianceModelApplicationsPage() {
  const location = useLocation();
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedId, setSelectedId] = useState(
    location.state?.selectedApplicationId ?? null,
  );

  // 백엔드에서 조회한 실제 신청 내역만 저장한다.
  const [applications, setApplications] = useState([]);

  // 반려 버튼을 누른 뒤 입력할 반려 사유다.
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // 승인·반려 API 처리 중 중복 클릭을 막는다.
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  /* 페이지 진입 시 백엔드의 전체 신청 내역을 조회한다. */
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getAiToolApplications();
        const apiApplications = Array.isArray(response.data)
          ? response.data
          : [];

        setApplications(
          apiApplications.map((application) => ({
              id: application.id,
              applicantName: application.applicantName,
              department: application.departmentName || "-",
              requestName: application.toolName,
              requestType: "AI Tool",
              purpose: application.purpose,
              requestedAt: new Date(application.createdAt).toLocaleDateString("ko-KR"),
              status: application.status === "APPROVED"
                ? "승인"
                : application.status === "REJECTED"
                  ? "반려"
                  : "검토 대기",
              statusType: application.status === "APPROVED"
                ? "approved"
                : application.status === "REJECTED"
                  ? "rejected"
                  : "pending",
              reviewer: application.reviewerId ? `담당자 #${application.reviewerId}` : "미배정",
              reviewComment: application.reviewComment,
              source: "api",
          })),
        );
      } catch (error) {
        console.error("AI Tool 신청 목록 조회 실패", error);
        setReviewError("AI Tool 신청 목록을 불러오지 못했습니다.");
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return applications.filter((application) => {
      const text = [application.requestName, application.applicantName, application.department, application.purpose]
        .join(" ")
        .toLowerCase();
      return (typeFilter === "전체" || application.requestType === typeFilter)
        && (statusFilter === "전체" || application.status === statusFilter)
        && (!query || text.includes(query));
    });
  }, [applications, keyword, typeFilter, statusFilter]);

  const selectedApplication = applications.find((application) => application.id === selectedId);
  const countStatus = (status) => applications.filter((application) => application.status === status).length;

  /* 승인·반려 결과를 목록과 요약 카드에 즉시 반영한다. */
  const handleReview = async (status) => {
    if (!selectedApplication || isReviewing) return;

    if (status === "REJECTED" && !rejectReason.trim()) {
      setReviewError("반려 사유를 입력해 주세요.");
      return;
    }

    setIsReviewing(true);
    setReviewError("");

    try {
      await reviewAiToolApplication(selectedApplication.id, {
        status,
        reviewComment: status === "REJECTED" ? rejectReason.trim() : "승인 처리",
      });

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === selectedApplication.id
            ? {
              ...application,
              status: status === "APPROVED" ? "승인" : "반려",
              statusType: status === "APPROVED" ? "approved" : "rejected",
              reviewer: "현재 사용자",
              reviewComment: status === "REJECTED" ? rejectReason.trim() : "승인 처리",
            }
            : application,
        ),
      );

      setIsRejecting(false);
      setRejectReason("");
      setSelectedId(null);
    } catch (error) {
      setReviewError(
        error.response?.data?.error?.message ||
          "검토 결과를 저장하지 못했습니다.",
      );
    } finally {
      setIsReviewing(false);
    }
  };

  /* 상세 팝업을 닫을 때 반려 입력 상태도 함께 초기화한다. */
  const handleModalClose = () => {
    setSelectedId(null);
    setIsRejecting(false);
    setRejectReason("");
    setReviewError("");
  };

  return (
    <div className="compliance-applications-page">
      <header className="compliance-applications-heading">
        <div>
          <h2>AI Tool · 모델 신청 현황</h2>
          <p>임직원이 신청한 AI Tool과 모델을 검토하고 승인 상태를 관리합니다.</p>
        </div>
        <span>총 {applications.length}건</span>
      </header>

      <section className="applications-summary-grid">
        <article><i className="all"><Boxes size={20} /></i><div><span>전체 신청</span><strong>{applications.length}건</strong></div></article>
        <article><i className="pending"><Clock3 size={20} /></i><div><span>검토 필요</span><strong>{countStatus("검토 대기") + countStatus("검토 중")}건</strong></div></article>
        <article><i className="approved"><CheckCircle2 size={20} /></i><div><span>승인</span><strong>{countStatus("승인")}건</strong></div></article>
        <article><i className="rejected"><XCircle size={20} /></i><div><span>반려</span><strong>{countStatus("반려")}건</strong></div></article>
      </section>

      <section className="applications-panel">
        <header className="applications-panel-header">
          <div><h3>신청 목록</h3><span>{filteredApplications.length}건</span></div>
          <label className="applications-search"><Search size={16} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="신청자, 부서, Tool·모델명 검색" /></label>
        </header>

        <div className="applications-filters">
          <div><span>신청 유형</span>{TYPE_FILTERS.map((filter) => <button key={filter} type="button" className={typeFilter === filter ? "active" : ""} onClick={() => setTypeFilter(filter)}>{filter}</button>)}</div>
          <label><span>검토 상태</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{STATUS_FILTERS.map((filter) => <option key={filter}>{filter}</option>)}</select></label>
        </div>

        <div className="applications-table-wrap">
          <table className="applications-table">
            <thead><tr><th>신청일</th><th>구분</th><th>AI Tool · 모델</th><th>신청자 / 부서</th><th>사용 목적</th><th>검토 상태</th><th /></tr></thead>
            <tbody>{filteredApplications.map((application) => (
              <tr key={application.id}>
                <td>{application.requestedAt}</td>
                <td><span className={`application-type ${application.requestType === "AI Tool" ? "tool" : "model"}`}>{application.requestType}</span></td>
                <td><strong>{application.requestName}</strong></td>
                <td><strong>{application.applicantName}</strong><small>{application.department}</small></td>
                <td><span className="application-purpose">{application.purpose || "업무 생산성 향상을 위한 사용 신청"}</span></td>
                <td><span className={`application-status ${application.statusType}`}>{application.status}</span></td>
                <td><button type="button" className="application-view-button" onClick={() => setSelectedId(application.id)}><Eye size={15} />상세</button></td>
              </tr>
            ))}</tbody>
          </table>
          {filteredApplications.length === 0 && <div className="applications-empty">조건에 맞는 신청 내역이 없습니다.</div>}
        </div>
      </section>

      {selectedApplication && (
        <div className="application-modal-backdrop" role="presentation" onMouseDown={handleModalClose}>
          <section className="application-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className={`application-type ${selectedApplication.requestType === "AI Tool" ? "tool" : "model"}`}>{selectedApplication.requestType}</span><h3>{selectedApplication.requestName}</h3></div><button type="button" onClick={handleModalClose}>닫기</button></header>
            <dl>
              <div><dt>신청자</dt><dd>{selectedApplication.applicantName} · {selectedApplication.department}</dd></div>
              <div><dt>신청일</dt><dd>{selectedApplication.requestedAt}</dd></div>
              <div><dt>검토 상태</dt><dd>{selectedApplication.status}</dd></div>
              <div><dt>검토 담당자</dt><dd>{selectedApplication.reviewer || "미배정"}</dd></div>
              <div className="wide"><dt>사용 목적</dt><dd>{selectedApplication.purpose || "업무 생산성 향상을 위한 사용 신청"}</dd></div>
            </dl>

            {isRejecting && (
              <div className="application-reject-area">
                <label htmlFor="application-reject-reason">반려 사유</label>
                <textarea
                  id="application-reject-reason"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  placeholder="신청자에게 전달할 반려 사유를 입력해 주세요."
                  rows={3}
                />
              </div>
            )}

            {reviewError && (
              <div className="application-review-error">
                {reviewError}
              </div>
            )}

            <footer className="application-review-footer">
              <button
                type="button"
                className="application-review-close"
                onClick={handleModalClose}
              >
                닫기
              </button>

              {!["승인", "반려"].includes(selectedApplication.status) && (
                <>
                  <button
                    type="button"
                    className="application-review-reject"
                    disabled={isReviewing}
                    onClick={() => {
                      if (isRejecting) {
                        handleReview("REJECTED");
                      } else {
                        setIsRejecting(true);
                        setReviewError("");
                      }
                    }}
                  >
                    <XCircle size={15} />
                    {isRejecting ? "반려 확정" : "반려"}
                  </button>

                  <button
                    type="button"
                    className="application-review-approve"
                    disabled={isReviewing}
                    onClick={() => handleReview("APPROVED")}
                  >
                    <CheckCircle2 size={15} />
                    승인
                  </button>
                </>
              )}
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default ComplianceModelApplicationsPage;
