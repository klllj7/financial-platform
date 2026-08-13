import { useEffect, useRef, useState } from "react";
import {
  getDocuments,
  getClauses,
  createDocument,
  createClause,
} from "../../api/regulationApi";
import "./RegulationMappingPage.css";

function RegulationMappingPage() {
  // 왼쪽: 법령 문서 목록, 지금 선택된 문서 id
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  // 오른쪽: 선택된 문서의 조항 목록
  const [clauses, setClauses] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  // "법령 문서 추가" 모달이 열려있는지, 입력 중인 제목
  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");

  // "조항 추가" 모달이 열려있는지, 입력 중인 값들
  const [isAddClauseModalOpen, setIsAddClauseModalOpen] = useState(false);
  const [newClauseNo, setNewClauseNo] = useState("");
  const [newClauseTitle, setNewClauseTitle] = useState("");
  const [newClauseDescription, setNewClauseDescription] = useState("");
  const [newClauseFile, setNewClauseFile] = useState(null);
  const [selectedClause, setSelectedClause] = useState(null);

  // 카드에서 "더보기/접기"로 펼쳐놓은 조항 id 목록
  // { 7: true, 10: false } 형태로, 조항마다 펼침 여부를 따로 기억한다.
  const [expandedClauseIds, setExpandedClauseIds] = useState({});

  // 조항 설명 <p> 태그의 실제 DOM을 조항 id별로 기억해뒀다가, 2줄보다 긴지 재는 데 쓴다.
  const descriptionRefs = useRef({});
  // 실제로 2줄을 넘어가서 "더보기" 버튼이 필요한 조항 id 목록
  const [truncatableClauseIds, setTruncatableClauseIds] = useState({});

  // 문서 목록을 서버에서 다시 불러온다.
  // 처음 화면에 들어올 때뿐 아니라, 새 문서를 등록한 직후에도 다시 불러야 해서
  // useEffect 밖에 별도 함수로 뺐다.
  const loadDocuments = async () => {
    try {
      const result = await getDocuments();
      setDocuments(result.data);
    } catch (error) {
      console.error("법령 문서 조회 실패:", error);
    }
  };

  // 선택된 문서의 조항 목록을 서버에서 다시 불러온다.
  // 새 조항을 등록한 직후에도 다시 불러야 해서 별도 함수로 뺐다.
  const loadClauses = async (docId, search) => {
    try {
      const result = await getClauses(docId, search);
      setClauses(result.data);
    } catch (error) {
      console.error("조항 목록 조회 실패:", error);
    }
  };

  // 처음 화면에 들어오면 문서 목록을 한 번 불러온다.
  useEffect(() => {
    loadDocuments();
  }, []);

  // 선택된 문서가 바뀔 때마다 그 문서의 조항 목록을 다시 불러온다.
  useEffect(() => {
    if (!selectedDocId) {
      setClauses([]);
      return;
    }

    loadClauses(selectedDocId, searchKeyword);
  }, [selectedDocId, searchKeyword]);

  // 조항 목록이 새로 그려질 때마다, 각 설명 텍스트가 실제로 2줄을 넘는지 측정한다.
  // scrollHeight(전체 내용 높이)가 clientHeight(2줄로 잘린 높이)보다 크면 "더 잘려있다"는 뜻이다.
  useEffect(() => {
    const next = {};

    Object.keys(descriptionRefs.current).forEach((clauseId) => {
      const el = descriptionRefs.current[clauseId];
      if (el) {
        next[clauseId] = el.scrollHeight > el.clientHeight + 1;
      }
    });

    setTruncatableClauseIds(next);
  }, [clauses]);

  // "법령 문서 추가" 모달의 등록 버튼 클릭
  const handleAddDocument = async (event) => {
    event.preventDefault();

    if (!newDocName.trim()) {
      alert("법령 제목을 입력해주세요.");
      return;
    }

    try {
      await createDocument(newDocName);
      setNewDocName("");
      setIsAddDocModalOpen(false);
      await loadDocuments();
    } catch (error) {
      console.error("법령 문서 등록 실패:", error);
      alert("법령 문서 등록에 실패했습니다.");
    }
  };

  // "조항 추가" 모달의 등록 버튼 클릭
  const handleAddClause = async (event) => {
    event.preventDefault();

    if (
      !newClauseNo.trim() ||
      !newClauseTitle.trim() ||
      !newClauseDescription.trim()
    ) {
      alert("조항 번호, 제목, 내용을 모두 입력해주세요.");
      return;
    }

    try {
      await createClause(
        selectedDocId,
        {
          clause_no: newClauseNo,
          title: newClauseTitle,
          description: newClauseDescription,
        },
        newClauseFile
      );

      // 입력 폼 초기화 + 모달 닫기
      setNewClauseNo("");
      setNewClauseTitle("");
      setNewClauseDescription("");
      setNewClauseFile(null);
      setIsAddClauseModalOpen(false);

      await loadClauses(selectedDocId);
    } catch (error) {
      console.error("조항 등록 실패:", error);
      alert("조항 등록에 실패했습니다.");
    }
  };

  // 카드 안의 "더보기/접기" 버튼 클릭
  // 카드 전체에도 onClick(상세보기 열기)이 걸려있어서, stopPropagation으로 그걸 막는다.
  const toggleClauseExpanded = (event, clauseId) => {
    event.stopPropagation();
    setExpandedClauseIds((prev) => ({
      ...prev,
      [clauseId]: !prev[clauseId],
    }));
  };

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
          <div className="regulation-document-list-header">
            <h3>법령 문서</h3>
            <button
              className="regulation-add-button"
              onClick={() => setIsAddDocModalOpen(true)}
            >
              + 추가
            </button>
          </div>

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
          <div className="regulation-document-list-header">
            <h3>조항 목록</h3>
            {selectedDocId && (
              <button
                className="regulation-add-button"
                onClick={() => setIsAddClauseModalOpen(true)}
              >
                + 추가
              </button>
            )}
          </div>

          {selectedDocId && (
            <input
              type="text"
              className="regulation-search-input"
              placeholder="조항 번호, 제목, 내용으로 검색"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          )}

          {!selectedDocId && <p>왼쪽에서 법령 문서를 선택해주세요.</p>}

          {clauses.map((clause) => (
            <div key={clause.id} className="regulation-clause-card"
            onClick = {() => setSelectedClause(clause)}>
              <p className="regulation-clause-title">
                {clause.clause_no} {clause.title}
              </p>
              <p
                className={`regulation-clause-description ${
                  expandedClauseIds[clause.id] ? "" : "is-clamped"
                }`}
                ref={(el) => {
                  descriptionRefs.current[clause.id] = el;
                }}
              >
                {clause.description}
              </p>

              {truncatableClauseIds[clause.id] && (
                <button
                  type="button"
                  className="regulation-clause-toggle"
                  onClick={(event) => toggleClauseExpanded(event, clause.id)}
                >
                  {expandedClauseIds[clause.id] ? "접기 " : "더보기 "}
                </button>
              )}

              {clause.file_name && (
                <a
                  className="regulation-clause-file-link"
                  href={clause.file_path}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                >
                  첨부파일: {clause.file_name}
                </a>
              )}
            </div>
          ))}
        </section>
      </section>

      {/* 법령 문서 추가 모달 */}
      {isAddDocModalOpen && (
        <div
          className="regulation-modal-backdrop"
          onClick={() => setIsAddDocModalOpen(false)}
        >
          <div
            className="regulation-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="regulation-modal-header">
              <h3>법령 문서 추가</h3>
              <button
                className="regulation-modal-close-button"
                onClick={() => setIsAddDocModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              className="regulation-modal-body"
              onSubmit={handleAddDocument}
            >
              <label>법령 제목</label>
              <input
                type="text"
                placeholder="예: 개인정보 보호법"
                value={newDocName}
                onChange={(event) => setNewDocName(event.target.value)}
              />

              <button type="submit" className="regulation-modal-save-button">
                등록
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 조항 추가 모달 */}
      {isAddClauseModalOpen && (
        <div
          className="regulation-modal-backdrop"
          onClick={() => setIsAddClauseModalOpen(false)}
        >
          <div
            className="regulation-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="regulation-modal-header">
              <h3>조항 추가</h3>
              <button
                className="regulation-modal-close-button"
                onClick={() => setIsAddClauseModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form
              className="regulation-modal-body"
              onSubmit={handleAddClause}
            >
              <label>조항 번호 *</label>
              <input
                type="text"
                placeholder="예: 제23조"
                value={newClauseNo}
                onChange={(event) => setNewClauseNo(event.target.value)}
                required
              />

              <label>조항 제목 *</label>
              <input
                type="text"
                placeholder="예: 민감정보의 처리 제한"
                value={newClauseTitle}
                onChange={(event) => setNewClauseTitle(event.target.value)}
                required
              />

              <label>내용 *</label>
              <textarea
                placeholder="조항 내용을 입력하세요"
                value={newClauseDescription}
                onChange={(event) =>
                  setNewClauseDescription(event.target.value)
                }
                required
              />

              <label>원본 파일 (선택)</label>
              <input
                type="file"
                onChange={(event) =>
                  setNewClauseFile(event.target.files[0] || null)
                }
              />

              <button type="submit" className="regulation-modal-save-button">
                등록
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 조항 상세보기 모달 */}
      {selectedClause && (
        <div
          className="regulation-modal-backdrop"
          onClick={() => setSelectedClause(null)}
        >
          <div
            className="regulation-modal regulation-detail-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="regulation-modal-header">
              <h3>
                {selectedClause.clause_no} {selectedClause.title}
              </h3>
              <button
                className="regulation-modal-close-button"
                onClick={() => setSelectedClause(null)}
              >
                ×
              </button>
            </div>

            <div className="regulation-detail-body">
              <p className="regulation-detail-description">
                {selectedClause.description}
              </p>

              {selectedClause.file_name && (
                <div className="regulation-detail-file">
                  <a
                    href={selectedClause.file_path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    원본 파일 다운로드: {selectedClause.file_name}
                  </a>

                  {/* PDF와 이미지는 모달 안에서 바로 미리볼 수 있게, 나머지 파일은 다운로드 링크만 제공한다. */}
                  {selectedClause.file_type === "application/pdf" && (
                    <iframe
                      className="regulation-detail-file-preview"
                      title="원본 파일 미리보기"
                      src={selectedClause.file_path}
                    />
                  )}
                  {selectedClause.file_type &&
                    selectedClause.file_type.startsWith("image/") && (
                      <img
                        className="regulation-detail-file-preview"
                        alt="원본 파일 미리보기"
                        src={selectedClause.file_path}
                      />
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default RegulationMappingPage;
