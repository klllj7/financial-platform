import { useEffect, useState } from "react";
import { getDocuments, getClauses, createMapping, deleteMapping } from "../../api/regulationApi";
import { getPolicies } from "../../api/policyApi";
import "./RegulationMappingPage.css";

function RegulationMappingPage() {
  // 왼쪽: 법령 문서 목록, 지금 선택된 문서 id
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // 오른쪽: 선택된 문서의 조항 목록
  const [clauses, setClauses] = useState([]);

  // 정책 연결에 쓸 정책 목록 (드롭다운용)
  const [policies, setPolicies] = useState([]);

  // 조항별로 드롭다운에서 고른 정책 id를 기억해두는 값
  // 예: { 7: 4 } → 7번 조항에서는 4번 정책을 선택해둔 상태
  const [selectedPolicyByClause, setSelectedPolicyByClause] = useState({});

  // 처리 중 상태 메시지 (성공/실패 알림용)
  const [statusMessage, setStatusMessage] = useState("");

  // 처음 화면에 들어오면 문서 목록과 정책 목록을 한 번씩 불러온다.
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const documentsResult = await getDocuments();
        setDocuments(documentsResult.data);

        const policiesResult = await getPolicies();
        setPolicies(policiesResult.data);
      } catch (error) {
        console.error("초기 데이터 조회 실패:", error);
      }
    };

    loadInitialData();
  }, []);

  // 선택된 문서가 바뀔 때마다 그 문서의 조항 목록을 다시 불러온다.
  useEffect(() => {
    if (!selectedDocId) {
      setClauses([]);
      return;
    }

    const loadClauses = async () => {
      try {
        const result = await getClauses(selectedDocId);
        setClauses(result.data);
      } catch (error) {
        console.error("조항 목록 조회 실패:", error);
      }
    };

    loadClauses();
  }, [selectedDocId]);

  // 조항의 드롭다운에서 정책을 고를 때
  const handlePolicySelect = (clauseId, policyId) => {
    setSelectedPolicyByClause((prev) => ({
      ...prev,
      [clauseId]: policyId,
    }));
  };

  // "연결" 버튼 클릭
  const handleConnect = async (clauseId) => {
    const policyId = selectedPolicyByClause[clauseId];

    if (!policyId) {
      alert("연결할 정책을 먼저 선택해주세요.");
      return;
    }

    try {
      await createMapping(clauseId, policyId);
      setStatusMessage("정책이 연결되었습니다.");
    } catch (error) {
      console.error("매핑 생성 실패:", error);
      setStatusMessage("연결에 실패했습니다.");
    }
  };

  // "해제" 버튼 클릭
  const handleDisconnect = async (clauseId) => {
    const policyId = selectedPolicyByClause[clauseId];

    if (!policyId) {
      alert("해제할 정책을 먼저 선택해주세요.");
      return;
    }

    try {
      await deleteMapping(clauseId, policyId);
      setStatusMessage("정책 연결이 해제되었습니다.");
    } catch (error) {
      console.error("매핑 삭제 실패:", error);
      setStatusMessage("해제에 실패했습니다.");
    }
  };

  return (
    <main className="regulation-page">
      <section className="regulation-page-header">
        <p className="regulation-page-eyebrow">REGULATION</p>
        <h2>규제 매핑</h2>
        <p>법령 조항과 사내 정책을 연결하거나 해제합니다.</p>
      </section>

      {statusMessage && (
        <p className="regulation-status-message">{statusMessage}</p>
      )}

      <section className="regulation-page-body">
        {/* 왼쪽: 문서 목록 */}
        <aside className="regulation-document-list">
          <h3>법령 문서</h3>
          <ul>
            {documents.map((document) => (
              <li key={document.id}>
                <button
                  className={
                    document.id === selectedDocId ? "is-selected" : ""
                  }
                  onClick={() => setSelectedDocId(document.id)}
                >
                  {document.doc_name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* 오른쪽: 선택된 문서의 조항 목록 */}
        <section className="regulation-clause-list">
          <h3>조항 목록</h3>

          {!selectedDocId && <p>왼쪽에서 법령 문서를 선택해주세요.</p>}

          {clauses.map((clause) => (
            <div key={clause.id} className="regulation-clause-card">
              <p className="regulation-clause-title">
                {clause.clause_no} {clause.title}
              </p>
              <p className="regulation-clause-description">
                {clause.description}
              </p>

              <div className="regulation-clause-actions">
                <select
                  value={selectedPolicyByClause[clause.id] || ""}
                  onChange={(event) =>
                    handlePolicySelect(clause.id, event.target.value)
                  }
                >
                  <option value="">정책 선택</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name}
                    </option>
                  ))}
                </select>

                <button onClick={() => handleConnect(clause.id)}>
                  연결
                </button>
                <button onClick={() => handleDisconnect(clause.id)}>
                  해제
                </button>
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

export default RegulationMappingPage;
