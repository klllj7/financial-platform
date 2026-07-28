import { useEffect, useState } from "react";
import { getDocuments, getClauses } from "../../api/regulationApi";
import "./RegulationMappingPage.css";

function RegulationMappingPage() {
  // 왼쪽: 법령 문서 목록, 지금 선택된 문서 id
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // 오른쪽: 선택된 문서의 조항 목록
  const [clauses, setClauses] = useState([]);

  // 처음 화면에 들어오면 문서 목록을 한 번 불러온다.
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const result = await getDocuments();
        setDocuments(result.data);
      } catch (error) {
        console.error("법령 문서 조회 실패:", error);
      }
    };

    loadDocuments();
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

  return (
    <main className="regulation-page">
      <section className="regulation-page-header">
        <p className="regulation-page-eyebrow">REGULATION</p>
        <h2>규제 관리</h2>
        <p>등록된 법령 문서와 세부 조항 목록을 조회합니다.</p>
      </section>

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
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}

export default RegulationMappingPage;
