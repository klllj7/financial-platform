import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import {
  getPolicies,
  createPolicy,
  approvePolicy,
  rejectPolicy,
  updatePolicy,
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

function PolicyManagementPage() {
  // 정책 목록
  const [policies, setPolicies] = useState([]);

  // 목록에 적용할 필터 (승인상태 / 활성여부)
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

  // 정책 요청(생성) 모달이 열려있는지, 그리고 폼 입력값
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [ruleContent, setRuleContent] = useState("");

  // 지금 클릭해서 상세 모달로 열어본 정책 (null이면 모달 닫힌 상태)
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // 모달 안에서 반려 사유를 입력받는 값
  const [rejectReasonInput, setRejectReasonInput] = useState("");

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

  // 필터 조건에 맞는 정책만 걸러낸 목록 (실제 화면에는 이걸 그린다)
  const filteredPolicies = policies.filter((policy) => {
    const statusMatch =
      statusFilter === "all" || policy.approval_status === statusFilter;

    const activeMatch =
      activeFilter === "all" ||
      (activeFilter === "active" && policy.active_yn) ||
      (activeFilter === "inactive" && !policy.active_yn);

    return statusMatch && activeMatch;
  });

  // 서버에서 정책 목록을 새로 받아와 policies state를 갱신한다.
  const fetchPolicies = async () => {
    const result = await getPolicies();
    setPolicies(result.data);
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

  // 요청 폼 제출 시: 새 정책을 관리자에게 요청(생성)하고 목록을 새로고침한다.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPolicy = {
      department_id: Number(departmentId),
      name: name,
      rule_content: JSON.parse(ruleContent),
    };
    await createPolicy(newPolicy);
    setIsRequestModalOpen(false);
    fetchPolicies(); // 정책 요청 후 목록 갱신
  };

  // "승인" 버튼 클릭 시: 해당 정책을 승인 처리하고 모달을 닫는다.
  const handleApprove = async (id) => {
    await approvePolicy(id);
    setSelectedPolicy(null);
    fetchPolicies(); // 정책 승인 후 목록 갱신
  };

  // "반려" 버튼 클릭 시: 입력한 사유와 함께 반려 처리하고 모달을 닫는다.
  const handleReject = async (id) => {
    await rejectPolicy(id, rejectReasonInput);
    setRejectReasonInput(""); // 반려 사유 초기화
    setSelectedPolicy(null);
    fetchPolicies(); // 정책 반려 후 목록 갱신
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
    setRejectReasonInput("");
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
        {/* 필터 바: 아이콘 + 드롭다운들 + 오른쪽에 건수/요청 버튼 */}
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
            <span className="policy-filter-count">{filteredPolicies.length}건</span>
            <button className="policy-primary-button" onClick={openRequestModal}>
              + 요청
            </button>
          </div>
        </div>

        <div className="policy-table-wrapper">
          <table className="policy-table">
            <thead>
              <tr>
                <th>정책명</th>
                <th>승인상태</th>
                <th>버전</th>
                <th>활성여부</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length === 0 && (
                <tr>
                  <td className="policy-empty-message" colSpan={4}>
                    조건에 맞는 정책이 없습니다.
                  </td>
                </tr>
              )}

              {filteredPolicies.map((policy) => (
                <tr key={policy.id} onClick={() => setSelectedPolicy(policy)}>
                  <td>
                    <div className="policy-name-cell">
                      <strong>{policy.name}</strong>
                      <span>{JSON.stringify(policy.rule_content)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`policy-status-badge ${policy.approval_status}`}>
                      {statusLabel[policy.approval_status]}
                    </span>
                  </td>
                  <td>v{policy.version}</td>
                  <td>
                    <span className={`policy-active-dot ${policy.active_yn ? "on" : "off"}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

                <div className="policy-form-group policy-form-group-wide">
                  <label>규칙 (JSON)</label>
                  <textarea
                    placeholder='{"allow_pii_input": false}'
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
                  <span>규칙 내용</span>
                  <strong>{JSON.stringify(selectedPolicy.rule_content)}</strong>
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

              {/* 승인대기 상태일 때만 승인/반려 버튼과 반려 사유 입력창을 보여준다. */}
              {selectedPolicy.approval_status === "pending" && (
                <div className="policy-approve-area">
                  <textarea
                    placeholder="반려 사유 (반려할 경우에만 입력)"
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                  />
                  <div className="policy-approve-buttons">
                    <button
                      className="policy-reject-button"
                      onClick={() => handleReject(selectedPolicy.id)}
                    >
                      반려
                    </button>
                    <button
                      className="policy-approve-button"
                      onClick={() => handleApprove(selectedPolicy.id)}
                    >
                      승인
                    </button>
                  </div>
                </div>
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
