import { useState } from "react";
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
  ITEMS,
} from "../../mocks/evidenceChecklistMock";

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

const GENERATION_MODES = ["자동", "반자동", "수동", "조건부"];

// "생성" 버튼을 눌렀을 때 preparedMaterial 문구를 임시 파일명으로 바꾼다.
const toTempFileName = (preparedMaterial) =>
  `${preparedMaterial.replace(/\s+/g, "_")}.tmp`;

function EvidenceChecklistPage() {
  // mock 데이터를 그대로 두면 "생성" 결과를 화면에 반영할 수 없어 로컬 상태로 복사해서 관리한다.
  const [items, setItems] = useState(ITEMS);
  const [expanded, setExpanded] = useState(
    Object.fromEntries(CATEGORY_META.map((c) => [c.key, true]))
  );
  const [naExpanded, setNaExpanded] = useState(false);
  const [filterCategory, setFilterCategory] = useState("전체");
  const [filterResult, setFilterResult] = useState("전체");
  const [filterEvidence, setFilterEvidence] = useState("전체");
  const [filterMode, setFilterMode] = useState("전체");
  const [activeTab, setActiveTab] = useState("detail");

  // "생성" 버튼을 눌러 팝업을 띄운 대상 항목 (없으면 팝업 닫힘)
  const [generateTarget, setGenerateTarget] = useState(null);

  const totalItems = items.length;
  const totalPrepared = items.filter((i) => i.evidence === "준비완료").length;
  const overallPct = Math.round((totalPrepared / totalItems) * 100);

  const filteredItems = (list) =>
    list.filter(
      (i) =>
        (filterResult === "전체" || i.result === filterResult) &&
        (filterEvidence === "전체" || i.evidence === filterEvidence) &&
        (filterMode === "전체" || i.generationMode === filterMode)
    );

  const visibleCategories =
    filterCategory === "전체"
      ? CATEGORY_META
      : CATEGORY_META.filter((c) => c.key === filterCategory);

  // 팝업에서 결과값을 선택하면 그 값으로 result/evidence/file을 한번에 갱신한다.
  const handleGenerateConfirm = (resultValue) => {
    if (!generateTarget) return;

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

      <div className="ce-panel ce-summary-panel">
        <div className="ce-summary-row">
          <span>평가구분: 2026년 자체평가 및 결과 제출</span>
          <span>진행상태: <strong>작성중</strong></span>
          <span>대상기간: 2026-01-01 ~ 2026-03-31</span>
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
        <select className="ce-select" value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
          <option value="전체">자료 준비방식: 전체</option>
          {GENERATION_MODES.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>

      <div className="ce-category-list">
        {visibleCategories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat.key);
          const prepared = catItems.filter((i) => i.evidence === "준비완료").length;
          const pct = Math.round((prepared / catItems.length) * 100);
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
                            <span className={resultBadgeClass(item.result)}>{item.result}</span>
                          </td>
                          <td>
                            {item.evidence === "준비완료" ? (
                              <span className="ce-evidence-done"><Check size={12} /> 준비완료</span>
                            ) : (
                              <span className="ce-evidence-pending"><Circle size={10} /> 미준비</span>
                            )}
                          </td>
                          <td>
                            {item.file ? (
                              <span className="ce-file-link"><FileText size={12} />{item.file}</span>
                            ) : item.generationMode === "수동" ? (
                              <button type="button" className="ce-upload-button">
                                <Upload size={12} /> 업로드
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="ce-generate-button"
                                onClick={() => setGenerateTarget(item)}
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
          onMouseDown={() => setGenerateTarget(null)}
        >
          <div
            className="ce-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="ce-modal-header">
              <h3>증빙자료 생성 — {generateTarget.no}. {generateTarget.title}</h3>
              <button type="button" className="ce-modal-close" onClick={() => setGenerateTarget(null)}>
                닫기
              </button>
            </header>

            <div className="ce-modal-body">
              <p className="ce-modal-desc">{generateTarget.preparedMaterial}</p>
              <p className="ce-modal-hint">생성 후 표시할 결과값을 선택하세요.</p>

              <div className="ce-modal-options">
                <button
                  type="button"
                  className="ce-modal-option ce-modal-option-done"
                  onClick={() => handleGenerateConfirm("이행")}
                >
                  이행으로 표시
                </button>
                <button
                  type="button"
                  className="ce-modal-option ce-modal-option-partial"
                  onClick={() => handleGenerateConfirm("부분이행")}
                >
                  부분이행으로 표시
                </button>
                <button
                  type="button"
                  className="ce-modal-option ce-modal-option-none"
                  onClick={() => handleGenerateConfirm("미이행")}
                >
                  미이행으로 유지
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvidenceChecklistPage;
