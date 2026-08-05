import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  setPolicyActive,
} from "../../api/policyApi";
import "./PolicyManagementPage.css";

// 승인상태 필터 탭 목록
const STATUS_FILTERS = [
  { value: "all", label: "전체" },
  { value: "pending", label: "승인대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
];

// 활성여부 필터 탭 목록
const ACTIVE_FILTERS = [
  { value: "all", label: "전체" },
  { value: "active", label: "활성화" },
  { value: "inactive", label: "비활성화" },
];

// 한 페이지에 보여줄 정책 수
const PAGE_SIZE = 5;

function PolicyManagementPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 로그인한 사용자 정보 (Sidebar.jsx와 같은 방식으로 localStorage에서 읽음) — "작성자"에 쓴다.
  const storedUser = localStorage.getItem("user");
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserName = currentUser?.name || "익명";

  // 정책 목록
  const [policies, setPolicies] = useState([]);

  // 목록에 적용할 필터 (승인상태 / 활성여부)
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // 현재 페이지 번호 (1부터 시작)
  const [currentPage, setCurrentPage] = useState(1);

  // 편집 모드 여부, 그리고 저장 전까지 화면에서만 들고 있는 활성여부 변경값
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingActiveChanges, setPendingActiveChanges] = useState({});

  // 정책 요청(생성) 모달이 열려있는지, 그리고 폼 입력값
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [ruleContent, setRuleContent] = useState("");

  // 지금 클릭해서 상세 모달로 열어본 정책 (null이면 모달 닫힌 상태)
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // 모달을 "수정 모드"로 볼지 여부, 그리고 수정 폼 입력값
  const [isEditing, setIsEditing] = useState(false);
  const [editRuleContent, setEditRuleContent] = useState("");
  const [editActiveYn, setEditActiveYn] = useState(false);

  // approval_status 값을 화면에 보여줄 한글 라벨로 바꿔주는 매핑
  const statusLabel = {
    pending: "승인대기",
    approved: "승인완료",
    rejected: "반려",
  };
  // rule_content가 문자열이면 그대로, 객체면 JSON으로 보여준다 (예전 데이터 호환용)
  const displayRuleContent = (ruleContent) => {
    if (typeof ruleContent === "string") {
    return ruleContent;
  }
  return JSON.stringify(ruleContent);
};

  // 필터 조건에 맞는 정책만 걸러낸 목록
  const filteredPolicies = policies.filter((policy) => {
    const statusMatch =
      statusFilter === "all" || policy.approval_status === statusFilter;

    const activeMatch =
      activeFilter === "all" ||
      (activeFilter === "active" && policy.active_yn) ||
      (activeFilter === "inactive" && !policy.active_yn);

    return statusMatch && activeMatch;
  });

  // 페이지네이션: 필터링된 목록 중 현재 페이지에 해당하는 부분만 잘라낸다.
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 필터가 바뀌면 1페이지로 되돌린다.
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, activeFilter]);

  // 서버에서 정책 목록을 새로 받아와 policies state를 갱신한다.
  // 활성화(active_yn: true)된 정책이 위로 오도록 정렬해서 저장한다.
  const fetchPolicies = async () => {
    const result = await getPolicies();
    const sorted = [...result.data].sort(
      (a, b) => Number(b.active_yn) - Number(a.active_yn)
    );
    setPolicies(sorted);

    const selectedPolicyId = location.state?.selectedPolicyId;
    if (selectedPolicyId != null) {
      const requestedPolicy = sorted.find(
        (policy) => String(policy.id) === String(selectedPolicyId),
      );

      if (requestedPolicy) {
        setSelectedPolicy(requestedPolicy);
      }

      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  };

  // 페이지가 처음 열릴 때 한 번 정책 목록을 불러온다.
  useEffect(() => {
    fetchPolicies();
  }, []);

  // "요청" 버튼 클릭 시: 요청 모달을 연다.
  const openRequestModal = () => {
    setDepartmentId("");
    setName("");
    setRuleContent("");
    setIsRequestModalOpen(true);
  };

  // 요청 폼 제출 시: 로그인한 사용자를 작성자로 넣어 새 정책을 요청(생성)하고 목록을 새로고침한다.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPolicy = {
      department_id: Number(departmentId),
      name: name,
      rule_content: ruleContent,
      requested_by: currentUserName,
    };
    await createPolicy(newPolicy);
    setIsRequestModalOpen(false);
    fetchPolicies(); // 정책 요청 후 목록 갱신
  };


  // "수정" 버튼 클릭 시: 현재 정책 값을 수정 폼에 채워넣고 수정 모드로 전환한다.
  const handleEditClick = () => {
    setEditRuleContent(JSON.stringify(selectedPolicy.rule_content));
    setEditActiveYn(selectedPolicy.active_yn);
    setIsEditing(true);
  };

  // 수정 폼 제출 시: rule_content / active_yn을 서버에 반영하고 모달을 닫는다.
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updatePolicy(selectedPolicy.id, {
      rule_content: JSON.parse(editRuleContent),
      active_yn: editActiveYn,
    });
    setIsEditing(false);
    setSelectedPolicy(null);
    fetchPolicies();
  };

  // 상세 모달을 닫을 때는 수정 모드/반려 사유 입력값도 같이 초기화한다.
  const closeModal = () => {
    setSelectedPolicy(null);
    setIsEditing(false);
  };

  // 지금 화면에 보여줄 활성여부 값: 편집 중 바꾼 게 있으면 그 값, 없으면 서버에 저장된 값
  const getDisplayedActive = (policy) =>
    policy.id in pendingActiveChanges ? pendingActiveChanges[policy.id] : policy.active_yn;

  // "편집" 버튼 클릭 시: 토글 스위치를 누를 수 있는 상태로 바꾼다.
  const handleEditModeClick = () => {
    setIsEditMode(true);
  };

  // 토글 스위치 클릭 시(편집 모드일 때만 동작): 화면에만 반영, 아직 서버에는 안 보낸다.
  const handleToggleActive = (policy) => {
    if (!isEditMode) return;
    setPendingActiveChanges((prev) => ({
      ...prev,
      [policy.id]: !getDisplayedActive(policy),
    }));
  };

  // "저장" 클릭 시: 바뀐 정책들만 서버에 반영하고 편집 모드를 끈다.
  const handleSaveEdit = async () => {
    await Promise.all(
      Object.entries(pendingActiveChanges).map(([id, active_yn]) =>
        setPolicyActive(id, active_yn)
      )
    );
    setPendingActiveChanges({});
    setIsEditMode(false);
    fetchPolicies();
  };

  // "취소" 클릭 시: 화면에서만 바꿔둔 값을 버리고 편집 모드를 끈다.
  const handleCancelEdit = () => {
    setPendingActiveChanges({});
    setIsEditMode(false);
  };

  return (
    <div className="policy-page">
      {/* 상단 제목 카드 */}
      <div className="policy-page-header">
        <div>
          <p className="policy-page-eyebrow">POLICY</p>
          <h2>정책 관리</h2>
          <p>부서별 AI 사용 정책을 관리자에게 요청하고, 승인/반려 현황을 확인합니다.</p>
        </div>
      </div>

      {/* 정책 목록: 행을 클릭하면 상세 모달이 열린다. */}
      <div className="policy-table-card">
        {/* 필터 바: 아이콘 + 드롭다운들 + 오른쪽에 건수/요청/편집 버튼 */}
        <div className="policy-filter-bar">
          <div className="policy-filter-icon-label">
            <Filter size={16} />
            <span>필터</span>
          </div>

          <div className="policy-filter-field">
            <label>승인상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className="policy-filter-field">
            <label>활성여부</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              {ACTIVE_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>

          <div className="policy-filter-bar-right">
            <div className="policy-filter-bar-right-top">
              <span className="policy-filter-count">{filteredPolicies.length}건</span>
              <button className="policy-primary-button" onClick={openRequestModal}>
                + 요청
              </button>
            </div>
            <button
              className={`policy-outline-button ${isEditMode ? "active" : ""}`}
              onClick={handleEditModeClick}
              disabled={isEditMode}
            >
              {isEditMode ? "편집 중" : "편집"}
            </button>
          </div>
        </div>

        <div className="policy-table-wrapper">
          <table className="policy-table">
            <thead>
              <tr>
                <th>정책명</th>
                <th>승인상태</th>
                <th>작성자</th>
                <th>버전</th>
                <th>활성여부</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPolicies.length === 0 && (
                <tr>
                  <td className="policy-empty-message" colSpan={5}>
                    조건에 맞는 정책이 없습니다.
                  </td>
                </tr>
              )}

              {paginatedPolicies.map((policy) => (
                <tr key={policy.id} onClick={() => setSelectedPolicy(policy)}>
                  <td>
                    <div className="policy-name-cell">
                      <strong>{policy.name}</strong>
                      <span>{displayRuleContent(policy.rule_content)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`policy-status-badge ${policy.approval_status}`}>
                      {statusLabel[policy.approval_status]}
                    </span>
                  </td>
                  <td>{policy.requested_by || "-"}</td>
                  <td>v{policy.version}</td>
                  <td>
                    {/* 토글 스위치: 편집 모드가 아니거나, 승인완료 상태가 아니면 클릭이 안 먹히도록 막는다. */}
                    <button
                      type="button"
                      className={`policy-toggle-switch ${getDisplayedActive(policy) ? "on" : "off"}`}
                      disabled={!isEditMode || policy.approval_status !== "approved"}
                      onClick={(e) => {
                        e.stopPropagation(); // 행 클릭(상세 모달 열기)으로 안 퍼지게
                        handleToggleActive(policy);
                      }}
                    >
                      <span className="policy-toggle-knob" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 바: 가운데 페이지 번호, 편집 모드일 때만 오른쪽에 저장/취소 버튼 */}
        <div className="policy-table-footer">
          <div className="policy-table-footer-side" />

          <div className="policy-pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="policy-table-footer-side policy-table-footer-actions">
            {isEditMode && (
              <>
                <button className="policy-cancel-button" onClick={handleCancelEdit}>
                  취소
                </button>
                <button className="policy-save-button" onClick={handleSaveEdit}>
                  저장
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 정책 요청(생성) 모달: 목록 헤더의 "+ 요청" 버튼을 눌렀을 때만 표시된다. */}
      {isRequestModalOpen && (
        <div className="policy-modal-backdrop" onClick={() => setIsRequestModalOpen(false)}>
          <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="policy-modal-header">
              <div>
                <p>정책 요청</p>
                <h3>새 정책을 관리자에게 요청합니다</h3>
              </div>
              <button
                className="policy-modal-close-button"
                onClick={() => setIsRequestModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="policy-modal-body">
              <form className="policy-form" onSubmit={handleSubmit}>
                <div className="policy-form-group">
                  <label>부서 ID</label>
                  <input
                    type="number"
                    placeholder="부서 ID"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  />
                </div>

                <div className="policy-form-group">
                  <label>정책 이름</label>
                  <input
                    type="text"
                    placeholder="정책 이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="policy-form-group">
                  <label>작성자</label>
                  <input type="text" value={currentUserName} disabled />
                </div>

                <div className="policy-form-group policy-form-group-wide">
                  <label>규칙 내용</label>
                  <textarea
                    placeholder="예: 개인정보 입력 시 자동 마스킹 처리"
                    value={ruleContent}
                    onChange={(e) => setRuleContent(e.target.value)}
                  />
                </div>

                <button type="submit" className="policy-modal-save-button">
                  요청
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 정책 상세 모달: selectedPolicy가 있을 때만 표시된다. */}
      {selectedPolicy && (
        <div className="policy-modal-backdrop" onClick={closeModal}>
          {/* 모달 내용 클릭은 배경 클릭(닫기)으로 전파되지 않게 막는다. */}
          <div className="policy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="policy-modal-header">
              <div>
                <p>{selectedPolicy.name}</p>
                <h3>버전 v{selectedPolicy.version}</h3>
              </div>
              <button className="policy-modal-close-button" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="policy-modal-body">
              <span className={`policy-status-badge ${selectedPolicy.approval_status}`}>
                {statusLabel[selectedPolicy.approval_status]}
              </span>

              <div className="policy-modal-info-list">
                <div>
                  <span>작성자</span>
                  <strong>{selectedPolicy.requested_by || "-"}</strong>
                </div>
                <div>
                  <span>규칙 내용</span>
                  <strong>{displayRuleContent(selectedPolicy.rule_content)}</strong>
                </div>
                <div>
                  <span>활성 여부</span>
                  <strong>{selectedPolicy.active_yn ? "활성" : "비활성"}</strong>
                </div>
              </div>

              {/* 반려 상태일 때만 반려 사유를 보여준다. */}
              {selectedPolicy.approval_status === "rejected" && (
                <p className="policy-reject-reason">
                  반려 사유: {selectedPolicy.reject_reason || "-"}
                </p>
              )}

              {/* 수정 모드가 아니면 "수정" 버튼만, 수정 모드면 수정 폼을 보여준다. */}
              {isEditing ? (
                <form className="policy-edit-form" onSubmit={handleEditSubmit}>
                  <label>규칙 (JSON)</label>
                  <textarea
                    value={editRuleContent}
                    onChange={(e) => setEditRuleContent(e.target.value)}
                  />
                  <label className="policy-edit-checkbox">
                    <input
                      type="checkbox"
                      checked={editActiveYn}
                      onChange={(e) => setEditActiveYn(e.target.checked)}
                    />
                    활성화
                  </label>
                  <button type="submit" className="policy-modal-save-button">
                    저장
                  </button>
                </form>
              ) : (
                <button className="policy-edit-button" onClick={handleEditClick}>
                  수정
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PolicyManagementPage;
