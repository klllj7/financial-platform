import { useEffect, useState } from "react";
import { getPolicies, createPolicy, approvePolicy, rejectPolicy, updatePolicy } from "../../api/policyApi";

function PolicyManagementPage() {
  const [policies, setPolicies] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [ruleContent, setRuleContent] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [istEditing, setIsEditing] = useState(false);
  const [editRuleContent, setEditRuleContent] = useState("");
  const [editActiveYn, setEditActiveYn] = useState(false);

    const fetchPolicies = async () => {
        const result = await getPolicies();
        setPolicies(result.data);
    };

      useEffect(() => {
        fetchPolicies();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newPolicy = {
            department_id: Number(departmentId),
            name: name,
            rule_content: JSON.parse(ruleContent)
        };
        await createPolicy(newPolicy);
        fetchPolicies(); // 정책 생성 후 목록 갱신
    };
    const handleApprove = async (id) => {
      await approvePolicy(id);
      setSelectedPolicy(null);
      fetchPolicies(); // 정책 승인 후 목록 갱신
    };

    const handleReject = async (id) => {
      await rejectPolicy(id, rejectReasonInput);
      setRejectReasonInput(""); // 반려 사유 초기화
      setSelectedPolicy(null);
      fetchPolicies(); // 정책 반려 후 목록 갱신
    }
    const statusLabel = {
  pending: "승인대기",
  approved: "승인완료",
  rejected: "반려",
};
const [rejectReasonInput, setRejectReasonInput] = useState("");

  return (
    <div>
      <h1>정책 관리</h1>
      <ul>
        {policies.map((policy) => (
          <li key={policy.id} onClick={() => setSelectedPolicy(policy)}>
            <h2>{policy.name}</h2>
            <span>{statusLabel[policy.approval_status]}</span>
            <p>{JSON.stringify(policy.rule_content)}</p>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="부서 ID"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        />
        <input
            type="text"
            placeholder="정책 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder='{"allow_pii_input": false}'
          value={ruleContent}
          onChange={(e) => setRuleContent(e.target.value)}
        />
        <button type="submit">정책 생성</button>
      </form>
      {selectedPolicy && (
        <div className="modal-overlay" onClick={() => setSelectedPolicy(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedPolicy.name}</h2>
            <p>상태: {statusLabel[selectedPolicy.approval_status]}</p>
            <p>버전: v{selectedPolicy.version}</p>
            <p>규칙: {JSON.stringify(selectedPolicy.rule_content)}</p>

            {selectedPolicy.approval_status === "pending" && (
              <>
              <textarea
              placeholder = "반려 사유 (반려할 경우에만 입력)"
              value = {rejectReasonInput}
              onChange = {(e) => setRejectReasonInput(e.target.value)}
              />
              <button onClick = {()=> handleApprove(selectedPolicy.id)}>승인</button>
              <button onClick = {()=> handleReject(selectedPolicy.id)}>반려</button>
              </>
            )}

            <button onClick={() => setSelectedPolicy(null)}>닫기
            </button>
      
      </div>
    </div>
  )}
    </div>
  );
}

export default PolicyManagementPage;