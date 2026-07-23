import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  FileText,
  Upload,
  Circle,
} from "lucide-react";

import {
  CATEGORY_META,
  NA_CATEGORIES,
  ITEMS,
} from "../../mocks/evidenceChecklistMock";

import "./EvidenceChecklistPage.css";

function progressTone(pct) {
  if (pct >= 80) return "ce-tone-good";
  if (pct >= 50) return "ce-tone-mid";
  return "ce-tone-low";
}

function resultBadgeClass(result) {
  const map = {
    이행: "ce-badge ce-badge-done",
    부분이행: "ce-badge ce-badge-partial",
    미이행: "ce-badge ce-badge-none",
    해당없음: "ce-badge ce-badge-na",
  };
  return map[result] || "ce-badge ce-badge-na";
}

function EvidenceChecklistPage() {
  const [expanded, setExpanded] = useState(
    Object.fromEntries(CATEGORY_META.map((c) => [c.key, true]))
  );
  const [naExpanded, setNaExpanded] = useState(false);
  const [filterCategory, setFilterCategory] = useState("전체");
  const [filterResult, setFilterResult] = useState("전체");
  const [filterEvidence, setFilterEvidence] = useState("전체");
  const [activeTab, setActiveTab] = useState("detail");

  const totalItems = ITEMS.length;
  const totalPrepared = ITEMS.filter((i) => i.evidence === "준비완료").length;
  const overallPct = Math.round((totalPrepared / totalItems) * 100);

  const filteredItems = (items) =>
    items.filter(
      (i) =>
        (filterResult === "전체" || i.result === filterResult) &&
        (filterEvidence === "전체" || i.evidence === filterEvidence)
    );

  const visibleCategories =
    filterCategory === "전체"
      ? CATEGORY_META
      : CATEGORY_META.filter((c) => c.key === filterCategory);

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
      </div>

      <div className="ce-category-list">
        {visibleCategories.map((cat) => {
          const catItems = ITEMS.filter((i) => i.category === cat.key);
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
                            ) : (
                              <button className="ce-upload-button"><Upload size={12} /> 업로드</button>
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
    </div>
  );
}

export default EvidenceChecklistPage;
