import { useEffect, useMemo, useState } from "react";
import { CheckCircle, FileText, Search, XCircle } from "lucide-react";
import { getPolicies, approvePolicy, rejectPolicy } from "../../api/policyApi";
import "./AdminPolicyPage.css";

const POLICY_STATUS_LABEL_MAP = {
  PENDING: "승인대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
};

// 기본 정렬 우선순위: 승인대기 -> 승인완료 -> 반려
const STATUS_SORT_ORDER = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

// 한 페이지에 보여줄 개수 선택지
const PAGE_SIZE_OPTIONS = [10, 20, 50];

// 페이지네이션 버튼에 표시할 번호 목록을 만든다.
// 페이지가 많으면 현재 페이지 주변 + 처음/끝만 보여주고 나머지는 "..."으로 줄인다.
const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  pages.push(1);
  if (windowStart > 2) {
    pages.push("...");
  }
  for (let page = windowStart; page <= windowEnd; page += 1) {
    pages.push(page);
  }
  if (windowEnd < totalPages - 1) {
    pages.push("...");
  }
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

// 날짜를 "YYYY-MM-DD" 형태로 보여준다.
const formatDate = (isoString) => (isoString ? isoString.slice(0, 10) : "-");

// rule_content(줄바꿈 포함 텍스트)를 "개요(첫 줄)" + "규칙 목록(나머지 줄)"로 나눈다.
const parseRuleContent = (ruleContent) => {
  const lines = (ruleContent || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    summary: lines[0] || "",
    rules: lines.slice(1),
  };
};

function AdminPolicyPage() {
  // 로그인한 관리자 이름 (Sidebar.jsx와 같은 방식) — 반려 처리자로 기록한다.
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserName = currentUser?.name || "관리자";

  // 전체 정책 목록 상태
  const [policies, setPolicies] = useState([]);

  // 승인 상태 필터
  const [statusFilter, setStatusFilter] = useState("ALL");

  // 정책명, 요청자를 검색하기 위한 검색어
  const [keyword, setKeyword] = useState("");

  // 상세 모달에 표시할 현재 선택 정책
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // 반려 입력 폼이 열려있는지, 그리고 입력값 3가지
  const [isRejectFormOpen, setIsRejectFormOpen] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejectDetailInput, setRejectDetailInput] = useState("");
  const [revisionRequestInput, setRevisionRequestInput] = useState("");

  // 페이지네이션: 한 페이지에 보여줄 개수, 현재 페이지 번호
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);

  // 서버에서 정책 목록을 받아와서, 이 페이지가 쓰는 필드 이름으로 변환한다.
  const fetchPolicies = async () => {
    const result = await getPolicies();
    const mapped = result.data.map((policy) => ({
      id: policy.id,
      policyName: policy.name,
      requester: policy.requested_by || "-",
      departmentName: policy.department_name || "-",
      version: `v${policy.version}`,
      requestedAt: formatDate(policy.createdAt),
      requestedAtRaw: policy.createdAt, // 정렬용 원본 날짜(시각 포함)
      status: policy.approval_status.toUpperCase(), // pending -> PENDING
      content: policy.rule_content,
      rejectReason: policy.reject_reason,
      rejectDetail: policy.reject_detail,
      revisionRequest: policy.revision_request,
      rejectedBy: policy.rejected_by,
      rejectedAt: formatDate(policy.rejected_at),
    }));
    setPolicies(mapped);
  };

  // 페이지가 처음 열릴 때 한 번 정책 목록을 불러온다.
  useEffect(() => {
    fetchPolicies();
  }, []);

  /* 상태, 검색어 조건에 맞는 정책만 추출한 뒤, 기본 정렬 규칙을 적용한다.
     정렬: 승인대기 -> 승인완료 -> 반려 순서, 같은 상태끼리는 요청일 최신순 */
  const filteredPolicies = useMemo(() => {
    const matched = policies.filter((policy) => {
      const matchesStatus = statusFilter === "ALL" || policy.status === statusFilter;

      // 대소문자 구분 없이 검색하기 위해 검색어를 소문자로 변환
      const lowerKeyword = keyword.toLowerCase();

      const matchesKeyword =
        policy.policyName.toLowerCase().includes(lowerKeyword) ||
        policy.requester.toLowerCase().includes(lowerKeyword);

      return matchesStatus && matchesKeyword;
    });

    return [...matched].sort((a, b) => {
      const statusDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      // 같은 상태면 요청일이 최신인(더 큰 날짜) 것이 먼저 오도록
      return new Date(b.requestedAtRaw) - new Date(a.requestedAtRaw);
    });
  }, [policies, statusFilter, keyword]);

  // 페이지네이션: 정렬/필터된 목록 중 현재 페이지에 해당하는 부분만 잘라낸다.
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 상태 필터, 검색어, 페이지 크기가 바뀌면 1페이지로 되돌린다.
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, keyword, pageSize]);

  const pendingCount = policies.filter((policy) => policy.status === "PENDING").length;   // 승인대기 정책 수
  const approvedCount = policies.filter((policy) => policy.status === "APPROVED").length; // 승인완료 정책 수
  const rejectedCount = policies.filter((policy) => policy.status === "REJECTED").length; // 반려된 정책 수

  // 상세 모달을 닫을 때는 반려 폼 입력값도 같이 초기화한다.
  const closeModal = () => {
    setSelectedPolicy(null);
    setIsRejectFormOpen(false);
    setRejectReasonInput("");
    setRejectDetailInput("");
    setRevisionRequestInput("");
  };

  /* 선택한 정책을 승인 처리 */
  const handleApprove = async (policyId) => {
    await approvePolicy(policyId);
    closeModal();
    fetchPolicies();
  };

  // "반려" 버튼 클릭 시: 바로 반려하지 않고 입력 폼을 연다.
  const openRejectForm = () => {
    setIsRejectFormOpen(true);
  };

  /* 반려 폼 제출 시: 사유/상세내용/보완요청사항과 함께 반려 처리 (사유는 필수) */
  const handleRejectSubmit = async () => {
    if (!rejectReasonInput.trim()) {
      return;
    }
    await rejectPolicy(selectedPolicy.id, {
      reject_reason: rejectReasonInput,
      reject_detail: rejectDetailInput,
      revision_request: revisionRequestInput,
      rejected_by: currentUserName,
    });
    closeModal();
    fetchPolicies();
  };

  return (
    <section className="admin-policy-page">
      {/* 페이지 상단 제목 및 설명 영역 */}
      <div className="admin-policy-header">
        <div>
          <p className="admin-policy-eyebrow">Admin Console</p>
          <h2>정책 승인</h2>
          <p>
            컴플라이언스 담당자가 요청한 AI 사용 정책을 검토하고,
            승인 또는 반려 처리합니다.
          </p>
        </div>

        <div className="admin-policy-header-icon">
          <FileText size={28} />
        </div>
      </div>

      {/* 승인대기, 승인완료, 반려 건수를 보여주는 요약 카드 */}
      <div className="admin-policy-summary-grid">
        <div className="admin-policy-summary-card">
          <span>승인대기</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="admin-policy-summary-card">
          <span>승인완료</span>
          <strong>{approvedCount}</strong>
        </div>

        <div className="admin-policy-summary-card">
          <span>반려</span>
          <strong>{rejectedCount}</strong>
        </div>
      </div>

      {/* 검색어 및 상태 필터 영역 */}
      <div className="admin-policy-filter-card">
        {/* 정책명, 요청자를 대상으로 검색 */}
        <div className="admin-policy-search-box">
          <Search size={16} />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="정책명, 요청자 검색"
          />
        </div>

        <div className="admin-policy-filter-group">
          <label htmlFor="policyStatusFilter">상태</label>
          <select
            id="policyStatusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">승인대기</option>
            <option value="APPROVED">승인완료</option>
            <option value="REJECTED">반려</option>
          </select>
        </div>

        <div className="admin-policy-filter-result">
          총 <strong>{filteredPolicies.length}</strong>건
        </div>
      </div>

      {/* 정책 승인 요청 목록 테이블 */}
      <div className="admin-policy-table-card">
        <div className="admin-policy-table-header">
          <h3>정책 승인 요청 목록</h3>
          <span>"상세"를 클릭하면 상세 내용을 확인할 수 있습니다.</span>
        </div>

        <div className="admin-policy-table-wrapper">
          <table className="admin-policy-table">
            <thead>
              <tr>
                <th>정책명</th>
                <th>요청자</th>
                <th>부서</th>
                <th>버전</th>
                <th>요청일</th>
                <th>상태</th>
                <th>상세</th>
              </tr>
            </thead>

            <tbody>
              {/* 필터/정렬을 통과한 정책 중, 현재 페이지에 해당하는 것만 행으로 출력 */}
              {paginatedPolicies.map((policy) => (
                <tr key={policy.id}>
                  <td>
                    <strong className="admin-policy-name-text">{policy.policyName}</strong>
                  </td>
                  <td>{policy.requester}</td>
                  <td>{policy.departmentName}</td>
                  <td>{policy.version}</td>
                  <td>{policy.requestedAt}</td>

                  <td>
                    <span className={`admin-policy-status-badge ${policy.status}`}>
                      {POLICY_STATUS_LABEL_MAP[policy.status]}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="admin-policy-detail-link"
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}

              {/* 필터 결과가 없을 때 안내 문구 표시 */}
              {paginatedPolicies.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-policy-empty-message">
                    조건에 맞는 정책 승인 요청이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션: 왼쪽에 페이지당 개수 선택, 가운데에 번호 이동 */}
        <div className="admin-policy-pagination-bar">
          <div className="admin-policy-page-size">
            <label htmlFor="policyPageSize">페이지당</label>
            <select
              id="policyPageSize"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}개씩 보기
                </option>
              ))}
            </select>
          </div>

          <div className="admin-policy-pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              {"<"}
            </button>

            {getPageNumbers(currentPage, totalPages).map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="admin-policy-pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={page === currentPage ? "active" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>

      {/* 선택한 정책이 있을 때만 상세 모달 표시 */}
      {selectedPolicy && (() => {
        const { summary, rules } = parseRuleContent(selectedPolicy.content);

        return (
          <div className="admin-policy-modal-backdrop" onClick={closeModal}>
            <div className="admin-policy-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-policy-modal-header">
                <div>
                  <h3>{selectedPolicy.policyName}</h3>
                  <p>버전 {selectedPolicy.version}</p>
                </div>

                <button type="button" className="admin-policy-modal-close" onClick={closeModal}>
                  ×
                </button>
              </div>

              <div className="admin-policy-modal-body">
                {/* 요청자 / 적용 부서 / 요청일 / 현재 상태 2x2 메타 정보 */}
                <div className="admin-policy-meta-grid">
                  <div>
                    <span>요청자</span>
                    <strong>{selectedPolicy.requester}</strong>
                  </div>
                  <div>
                    <span>적용 부서</span>
                    <strong>{selectedPolicy.departmentName}</strong>
                  </div>
                  <div>
                    <span>요청일</span>
                    <strong>{selectedPolicy.requestedAt}</strong>
                  </div>
                  <div>
                    <span>현재 상태</span>
                    <span className={`admin-policy-status-badge ${selectedPolicy.status}`}>
                      {POLICY_STATUS_LABEL_MAP[selectedPolicy.status]}
                    </span>
                  </div>
                </div>

                {/* 정책 개요: 연한 회색 배경 박스 */}
                <div className="admin-policy-summary-box">
                  <h4>정책 개요</h4>
                  <p>{summary || "-"}</p>
                </div>

                {/* 정책 규칙: 번호가 붙은 목록 */}
                {rules.length > 0 && (
                  <div className="admin-policy-rules-section">
                    <h4>정책 규칙</h4>
                    <ol className="admin-policy-rules-list">
                      {rules.map((rule, index) => (
                        <li key={index}>
                          <span className="admin-policy-rule-number">{index + 1}</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* 반려된 정책이면 반려 내용 박스를 보여준다. */}
                {selectedPolicy.status === "REJECTED" && (
                  <div className="admin-policy-rejection-box">
                    <h4>⚠ 반려 내용</h4>

                    <div className="admin-policy-rejection-meta">
                      <div>
                        <span>반려 처리자</span>
                        <strong>{selectedPolicy.rejectedBy || "-"}</strong>
                      </div>
                      <div>
                        <span>반려 일시</span>
                        <strong>{selectedPolicy.rejectedAt}</strong>
                      </div>
                    </div>

                    <div className="admin-policy-rejection-field">
                      <span>반려 사유</span>
                      <strong>{selectedPolicy.rejectReason || "-"}</strong>
                    </div>

                    <div className="admin-policy-rejection-field">
                      <span>반려 상세 내용</span>
                      <p>{selectedPolicy.rejectDetail || "-"}</p>
                    </div>

                    {selectedPolicy.revisionRequest && (
                      <div className="admin-policy-revision-box">
                        <span>수정 / 보완 요청사항</span>
                        <p>{selectedPolicy.revisionRequest}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* "반려" 버튼을 눌렀을 때만 보이는 반려 입력 폼 */}
                {isRejectFormOpen && (
                  <div className="admin-policy-reject-form">
                    <div className="admin-policy-form-group">
                      <label>반려 사유</label>
                      <input
                        type="text"
                        value={rejectReasonInput}
                        onChange={(e) => setRejectReasonInput(e.target.value)}
                        placeholder="예: 보존 기간 산정 근거 불명확"
                      />
                    </div>

                    <div className="admin-policy-form-group">
                      <label>반려 상세 내용</label>
                      <textarea
                        value={rejectDetailInput}
                        onChange={(e) => setRejectDetailInput(e.target.value)}
                        placeholder="구체적인 반려 사유를 작성하세요"
                      />
                    </div>

                    <div className="admin-policy-form-group">
                      <label>수정 / 보완 요청사항</label>
                      <textarea
                        value={revisionRequestInput}
                        onChange={(e) => setRevisionRequestInput(e.target.value)}
                        placeholder="재신청 시 보완해야 할 점을 작성하세요"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 상세 모달 하단 버튼 영역 */}
              <div className="admin-policy-modal-footer">
                {isRejectFormOpen ? (
                  <>
                    <button
                      type="button"
                      className="admin-policy-modal-cancel-button"
                      onClick={() => setIsRejectFormOpen(false)}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="admin-policy-modal-reject-button"
                      onClick={handleRejectSubmit}
                      disabled={!rejectReasonInput.trim()}
                    >
                      <XCircle size={15} />
                      반려 제출
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="admin-policy-modal-cancel-button"
                      onClick={closeModal}
                    >
                      닫기
                    </button>

                    <button
                      type="button"
                      className="admin-policy-modal-reject-button"
                      onClick={openRejectForm}
                      disabled={selectedPolicy.status === "REJECTED"}
                    >
                      <XCircle size={15} />
                      반려
                    </button>

                    <button
                      type="button"
                      className="admin-policy-modal-approve-button"
                      onClick={() => handleApprove(selectedPolicy.id)}
                      disabled={selectedPolicy.status === "APPROVED"}
                    >
                      <CheckCircle size={15} />
                      승인
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

export default AdminPolicyPage;
