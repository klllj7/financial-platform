import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  FileText,
  Upload,
  Sparkles,
  Circle,
} from "lucide-react";

import {
  CATEGORY_META,
  NA_CATEGORIES,
} from "../../mocks/evidenceChecklistMock";
import {
  getEvidenceChecklist,
  updateEvidenceItemResult,
  generateEvidenceItem,
} from "../../api/reportApi";

import "./EvidenceChecklistPage.css";

export function progressTone(pct) {
  if (pct >= 80) return "ce-tone-good";
  if (pct >= 50) return "ce-tone-mid";
  return "ce-tone-low";
}

export function resultBadgeClass(result) {
  const map = {
    이행: "ce-badge ce-badge-done",
    부분이행: "ce-badge ce-badge-partial",
    미이행: "ce-badge ce-badge-none",
    해당없음: "ce-badge ce-badge-na",
  };
  return map[result] || "ce-badge ce-badge-na";
}

// 백엔드(evidence.service.js GENERATORS_BY_ITEM_NO)가 실제로 자동생성을 지원하는
// 항목 번호. 여기 없는 번호는 백엔드 구현 전이라 기존 수동 선택 방식으로 남겨둔다.
// 백엔드에 항목이 추가되면 이 배열에도 번호를 함께 추가해야 한다.
const AUTO_GENERATE_SUPPORTED_ITEM_NOS = ["5", "6", "7"];

// 상시평가 대상연도. 현재는 화면 문구("2026년 자체평가")와 동일하게 고정값으로 둔다.
const TARGET_YEAR = 2026;

// 사이드바(Sidebar.jsx)와 동일한 방식으로 로그인 사용자 정보를 안전하게 읽어온다.
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// "생성" 버튼을 눌렀을 때 preparedMaterial 문구를 임시 파일명으로 바꾼다.
const toTempFileName = (preparedMaterial) =>
  `${preparedMaterial.replace(/\s+/g, "_")}.tmp`;

function EvidenceChecklistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expanded, setExpanded] = useState(
    Object.fromEntries(CATEGORY_META.map((c) => [c.key, true]))
  );
  const [naExpanded, setNaExpanded] = useState(false);
  const [filterCategory, setFilterCategory] = useState("전체");
  const [filterResult, setFilterResult] = useState("전체");
  const [filterEvidence, setFilterEvidence] = useState("전체");
  const [activeTab, setActiveTab] = useState("detail");

  // 팝업을 띄운 대상 항목 (없으면 팝업 닫힘). "생성" 버튼 또는 결과 배지 클릭으로 연다.
  const [generateTarget, setGenerateTarget] = useState(null);
  // "confirm-generate": 실제 생성 실행 단계 (⑤⑥⑦만) / "pick-result": 이행·부분이행·미이행 선택 단계
  const [modalStep, setModalStep] = useState("pick-result");
  // true면 결과값만 바꾸고 evidence/file은 건드리지 않는다 (결과 배지 클릭, 생성 직후 확정 단계).
  // false면 기존 수동 항목 흐름(evidence를 "준비완료"로, 임시 파일명 부여)을 그대로 쓴다.
  const [pickResultOnly, setPickResultOnly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const departmentId = getStoredUser()?.department?.id ?? null;

  useEffect(() => {
    if (!departmentId) {
      setError("소속 부서 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      setLoading(false);
      return;
    }

    getEvidenceChecklist({ departmentId, targetYear: TARGET_YEAR })
      .then((res) => {
        setItems(res.data.items);
      })
      .catch((err) => {
        console.error("증빙자료 목록 조회 실패", err);
        setError("증빙자료 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [departmentId]);

  const totalItems = items.length;
  const totalPrepared = items.filter((i) => i.evidence === "준비완료").length;
  const overallPct = totalItems ? Math.round((totalPrepared / totalItems) * 100) : 0;

  const filteredItems = (list) =>
    list.filter(
      (i) =>
        (filterResult === "전체" || i.result === filterResult) &&
        (filterEvidence === "전체" || i.evidence === filterEvidence)
    );

  const visibleCategories =
    filterCategory === "전체"
      ? CATEGORY_META
      : CATEGORY_META.filter((c) => c.key === filterCategory);

  // 팝업을 닫고 상태를 초기화한다 (모달을 다시 열 때 이전 단계가 남아있지 않도록).
  const closeModal = () => {
    if (saving) return;
    setGenerateError(null);
    setGenerateTarget(null);
  };

  // "생성" 버튼 클릭. 실제 자동생성을 지원하는 항목(⑤⑥⑦)은 먼저 파일을 만들게 하고,
  // 아직 지원하지 않는 항목은 기존처럼 결과값을 바로 고르게 한다.
  const openGenerateModal = (item) => {
    setGenerateError(null);
    const supported = AUTO_GENERATE_SUPPORTED_ITEM_NOS.includes(item.no);
    setPickResultOnly(!supported);
    setModalStep(supported ? "confirm-generate" : "pick-result");
    setGenerateTarget(item);
  };

  // 결과 배지를 클릭했을 때. 이미 준비된 항목이든 아니든, 결과값만 바로 수정할 수 있게 한다.
  const openEditResultModal = (item) => {
    setGenerateError(null);
    setPickResultOnly(true);
    setModalStep("pick-result");
    setGenerateTarget(item);
  };

  /*
    아직 자동생성이 연결되지 않은 항목(①②③⑧⑨ 등)에서 결과값을 고르면:
    1) result는 실제 백엔드(PATCH /report/evidence/:itemNo/result)에 저장한다.
    2) evidence/file은 실제 자동생성 API가 없어서 화면에서만 "준비완료"로 바뀐 것처럼
       보여준다 (새로고침하면 원래 상태로 돌아간다 — 백엔드에 이 항목의 자동생성 API가
       추가되면 handleAutoGenerate 쪽으로 옮겨야 한다).
  */
  const handleGenerateConfirm = async (resultValue) => {
    if (!generateTarget || !departmentId) return;

    setSaving(true);
    try {
      await updateEvidenceItemResult({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
        result: resultValue,
      });

      setItems((prev) =>
        prev.map((i) =>
          i.no === generateTarget.no
            ? {
                ...i,
                result: resultValue,
                evidence: "준비완료",
                file: toTempFileName(generateTarget.preparedMaterial),
              }
            : i
        )
      );
      setGenerateTarget(null);
    } catch (err) {
      console.error("결과 저장 실패", err);
      alert("결과 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 결과 배지 클릭으로 열었을 때, 또는 ⑤⑥⑦ 실제 생성 직후 결과를 확정할 때 쓴다.
  // evidence/file은 이미 올바른 값이 들어있으므로(또는 애초에 건드릴 필요가 없으므로)
  // result만 바꾼다.
  const handleResultOnlyUpdate = async (resultValue) => {
    if (!generateTarget || !departmentId) return;

    setSaving(true);
    try {
      await updateEvidenceItemResult({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
        result: resultValue,
      });

      setItems((prev) =>
        prev.map((i) => (i.no === generateTarget.no ? { ...i, result: resultValue } : i))
      );
      setGenerateTarget(null);
    } catch (err) {
      console.error("결과 저장 실패", err);
      alert("결과 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /*
    ⑤⑥⑦번처럼 백엔드가 실제로 자동생성을 지원하는 항목은 실제 탐지 로그 기반으로
    파일을 만든다. 결과값(이행/부분이행/미이행)은 여기서 자동으로 정하지 않고,
    생성이 끝나면 pick-result 단계로 넘어가 사람이 직접 고르게 한다
    (기본값은 "미이행" — backend upsertGeneratedEvidence 참고).
  */
  const handleAutoGenerate = async () => {
    if (!generateTarget || !departmentId) return;

    setSaving(true);
    setGenerateError(null);
    try {
      const res = await generateEvidenceItem({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
      });
      const { fileName, filePath, result } = res.data;

      setItems((prev) =>
        prev.map((i) =>
          i.no === generateTarget.no
            ? { ...i, evidence: "준비완료", file: fileName, filePath, result }
            : i
        )
      );
      setModalStep("pick-result");
    } catch (err) {
      console.error("증빙자료 생성 실패", err);
      setGenerateError(
        err.response?.data?.error?.message || "증빙자료 생성에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="evidence-checklist-page">
      <div className="ce-heading">
        <div>
          <h2>상시평가 증빙자료</h2>
          <p>정보보호 상시평가 대비 소명자료 준비 현황을 관리합니다.</p>
        </div>
      </div>

      <div className="ce-disclaimer-card">
        <div className="ce-disclaimer-content">
          본 자료는 「금융분야 인공지능 보안 안내서」 점검항목을 준용한 초안이며, 정보보호 상시평가
          143개 소항목과의 공식 매핑이 아닙니다.
        </div>
      </div>

      {loading && <div className="ce-loading">증빙자료 목록을 불러오는 중입니다...</div>}
      {error && <div className="ce-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="ce-panel ce-summary-panel">
            <div className="ce-summary-row">
              <span>평가구분: {TARGET_YEAR}년 자체평가 및 결과 제출</span>
              <span>진행상태: <strong>작성중</strong></span>
              <span>대상기간: {TARGET_YEAR}-01-01 ~ {TARGET_YEAR}-03-31</span>
            </div>
            <div className="ce-summary-progress">
              <span className="ce-summary-progress-label">
                소명자료 완성도 {totalPrepared}/{totalItems}항목 ({overallPct}%)
              </span>
              <div className="ce-progress-track">
                <div
                  className={`ce-progress-fill ${progressTone(overallPct)}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="ce-tab-list">
            <button
              className={`ce-tab ${activeTab === "detail" ? "active" : ""}`}
              onClick={() => setActiveTab("detail")}
            >
              평가결과 상세
            </button>
            <button
              className={`ce-tab ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              평가결과 요약
            </button>
            <button
              className={`ce-tab ${activeTab === "download" ? "active" : ""}`}
              onClick={() => setActiveTab("download")}
            >
              엑셀 및 보고서 다운로드
            </button>
          </div>

          <div className="ce-filters">
            <select className="ce-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="전체">대분류: 전체</option>
              {CATEGORY_META.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <select className="ce-select" value={filterResult} onChange={(e) => setFilterResult(e.target.value)}>
              <option value="전체">결과: 전체</option>
              <option value="이행">이행</option>
              <option value="부분이행">부분이행</option>
              <option value="미이행">미이행</option>
            </select>
            <select className="ce-select" value={filterEvidence} onChange={(e) => setFilterEvidence(e.target.value)}>
              <option value="전체">증빙상태: 전체</option>
              <option value="준비완료">준비완료</option>
              <option value="미준비">미준비</option>
            </select>
          </div>

          <div className="ce-category-list">
            {visibleCategories.map((cat) => {
              const catItems = items.filter((i) => i.category === cat.key);
              const prepared = catItems.filter((i) => i.evidence === "준비완료").length;
              const pct = catItems.length ? Math.round((prepared / catItems.length) * 100) : 0;
              const tone = progressTone(pct);
              const isOpen = expanded[cat.key];
              const rows = filteredItems(catItems);

              return (
                <div key={cat.key} className="ce-panel ce-category">
                  <button
                    className="ce-category-header"
                    onClick={() => setExpanded((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                  >
                    {isOpen ? <ChevronDown size={16} className="ce-chevron" /> : <ChevronRight size={16} className="ce-chevron" />}
                    <span className="ce-category-title">{cat.label}</span>
                    <span className={`ce-count-badge ${tone}`}>
                      {prepared}/{catItems.length} 준비완료
                    </span>
                    <div className="ce-progress-track ce-progress-track-sm">
                      <div className={`ce-progress-fill ${tone}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="ce-pct-text">{pct}%</span>
                  </button>

                  {isOpen && (
                    <div className="ce-table-wrapper">
                      <table className="ce-table">
                        <thead>
                          <tr>
                            <th className="ce-col-no">번호</th>
                            <th>항목명</th>
                            <th className="ce-col-result">결과</th>
                            <th className="ce-col-evidence">증빙상태</th>
                            <th className="ce-col-file">증빙파일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 && (
                            <tr>
                              <td colSpan={5} className="ce-empty-row">
                                필터 조건에 해당하는 항목이 없습니다.
                              </td>
                            </tr>
                          )}
                          {rows.map((item) => (
                            <tr key={item.no}>
                              <td className="ce-col-no">{item.no}</td>
                              <td>{item.title}</td>
                              <td>
                                <button
                                  type="button"
                                  className="ce-result-badge-button"
                                  onClick={() => openEditResultModal(item)}
                                  title="클릭해서 결과 수정"
                                >
                                  <span className={resultBadgeClass(item.result)}>{item.result}</span>
                                </button>
                              </td>
                              <td>
                                {item.evidence === "준비완료" ? (
                                  <span className="ce-evidence-done"><Check size={12} /> 준비완료</span>
                                ) : (
                                  <span className="ce-evidence-pending"><Circle size={10} /> 미준비</span>
                                )}
                              </td>
                              <td>
                                {item.filePath ? (
                                  <a
                                    className="ce-file-link"
                                    href={item.filePath}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <FileText size={12} />{item.file}
                                  </a>
                                ) : item.file ? (
                                  <span className="ce-file-link"><FileText size={12} />{item.file}</span>
                                ) : item.generationMode === "수동" ? (
                                  <button type="button" className="ce-upload-button">
                                    <Upload size={12} /> 업로드
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="ce-generate-button"
                                    onClick={() => openGenerateModal(item)}
                                  >
                                    <Sparkles size={12} /> 생성
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="ce-panel ce-category">
              <button className="ce-category-header" onClick={() => setNaExpanded((v) => !v)}>
                {naExpanded ? <ChevronDown size={16} className="ce-chevron" /> : <ChevronRight size={16} className="ce-chevron" />}
                <span className="ce-category-title ce-na-title">해당없음 (서비스 범위 외)</span>
                <span className="ce-na-tag">범위 외</span>
              </button>
              {naExpanded && (
                <div className="ce-na-body">
                  {NA_CATEGORIES.map((c) => (
                    <div key={c}>{c} — 매핑되는 점검항목 없음</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {generateTarget && (
            <div
              className="ce-modal-backdrop"
              role="presentation"
              onMouseDown={closeModal}
            >
              <div
                className="ce-modal"
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <header className="ce-modal-header">
                  <h3>
                    {modalStep === "confirm-generate" ? "증빙자료 생성" : "결과 확인·수정"}
                    {" — "}{generateTarget.no}. {generateTarget.title}
                  </h3>
                  <button
                    type="button"
                    className="ce-modal-close"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    닫기
                  </button>
                </header>

                <div className="ce-modal-body">
                  <p className="ce-modal-desc">{generateTarget.preparedMaterial}</p>

                  {modalStep === "confirm-generate" ? (
                    <>
                      <p className="ce-modal-hint">
                        실제 탐지·처리 로그를 기반으로 증빙자료를 생성합니다. 생성 후 결과값(이행/부분이행/미이행)을 선택하는 단계로 이어집니다.
                      </p>
                      {generateError && <p className="ce-modal-error">{generateError}</p>}
                      <div className="ce-modal-options">
                        <button
                          type="button"
                          className="ce-modal-option ce-modal-option-done"
                          disabled={saving}
                          onClick={handleAutoGenerate}
                        >
                          {saving ? "생성 중..." : "지금 생성하기"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="ce-modal-hint">
                        결과값을 선택하세요. 선택하지 않고 닫으면 기본값인 "미이행"으로 유지됩니다.
                      </p>
                      <div className="ce-modal-options">
                        <button
                          type="button"
                          className="ce-modal-option ce-modal-option-done"
                          disabled={saving}
                          onClick={() =>
                            pickResultOnly ? handleResultOnlyUpdate("이행") : handleGenerateConfirm("이행")
                          }
                        >
                          이행으로 표시
                        </button>
                        <button
                          type="button"
                          className="ce-modal-option ce-modal-option-partial"
                          disabled={saving}
                          onClick={() =>
                            pickResultOnly ? handleResultOnlyUpdate("부분이행") : handleGenerateConfirm("부분이행")
                          }
                        >
                          부분이행으로 표시
                        </button>
                        <button
                          type="button"
                          className="ce-modal-option ce-modal-option-none"
                          disabled={saving}
                          onClick={() =>
                            pickResultOnly ? handleResultOnlyUpdate("미이행") : handleGenerateConfirm("미이행")
                          }
                        >
                          미이행으로 유지
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EvidenceChecklistPage;
