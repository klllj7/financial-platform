import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, Eye, Search, ShieldAlert } from "lucide-react";

import { complianceRiskEvents } from "../../../mocks/complianceDashboardMock";
import "./ComplianceRiskEventsPage.css";

const RISK_FILTERS = ["전체", "HIGH", "MEDIUM", "LOW"];
const STATUS_FILTERS = ["전체", "미조치", "조치 중", "모니터링", "조치 완료"];

function ComplianceRiskEventsPage() {
  const location = useLocation();
  const [keyword, setKeyword] = useState("");
  const [riskFilter, setRiskFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedEventId, setSelectedEventId] = useState(
    location.state?.selectedEventId ?? null,
  );

  const events = Array.isArray(complianceRiskEvents) ? complianceRiskEvents : [];

  const filteredEvents = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return events.filter((event) => {
      const text = [event.userName, event.department, event.eventType, event.modelName, event.promptSummary]
        .join(" ")
        .toLowerCase();
      return (riskFilter === "전체" || event.riskLevel === riskFilter)
        && (statusFilter === "전체" || event.actionStatus === statusFilter)
        && (!query || text.includes(query));
    });
  }, [events, keyword, riskFilter, statusFilter]);

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const countBy = (key, value) => events.filter((event) => event[key] === value).length;

  return (
    <div className="compliance-risk-events-page">
      <header className="compliance-risk-events-heading">
        <div>
          <h2>위험 이벤트 관리</h2>
          <p>전사 AI 사용 중 탐지된 위험 이벤트를 확인하고 조치 상태를 관리합니다.</p>
        </div>
        <span>2026-07-24 기준</span>
      </header>

      <section className="risk-events-summary-grid">
        <article><i className="total"><ShieldAlert size={20} /></i><div><span>전체 이벤트</span><strong>{events.length}건</strong></div></article>
        <article><i className="high"><AlertTriangle size={20} /></i><div><span>HIGH 위험</span><strong>{countBy("riskLevel", "HIGH")}건</strong></div></article>
        <article><i className="pending"><Clock3 size={20} /></i><div><span>미조치</span><strong>{countBy("actionStatus", "미조치")}건</strong></div></article>
        <article><i className="completed"><CheckCircle2 size={20} /></i><div><span>조치 완료</span><strong>{countBy("actionStatus", "조치 완료")}건</strong></div></article>
      </section>

      <section className="risk-events-panel">
        <header className="risk-events-panel-header">
          <div><h3>탐지 이벤트 목록</h3><span>{filteredEvents.length}건</span></div>
          <label className="risk-events-search">
            <Search size={16} />
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="사용자, 부서, 탐지 유형 검색" />
          </label>
        </header>

        <div className="risk-events-filters">
          <div><span>위험 등급</span>{RISK_FILTERS.map((filter) => (
            <button key={filter} type="button" className={riskFilter === filter ? "active" : ""} onClick={() => setRiskFilter(filter)}>{filter}</button>
          ))}</div>
          <label><span>조치 상태</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_FILTERS.map((filter) => <option key={filter}>{filter}</option>)}
          </select></label>
        </div>

        <div className="risk-events-table-wrap">
          <table className="risk-events-table">
            <thead><tr><th>발생 시각</th><th>위험 등급</th><th>사용자 / 부서</th><th>탐지 유형</th><th>사용 모델</th><th>조치 상태</th><th /></tr></thead>
            <tbody>{filteredEvents.map((event) => (
              <tr key={event.id}>
                <td>{event.occurredAt}</td>
                <td><span className={`risk-level ${event.riskLevel.toLowerCase()}`}>{event.riskLevel}</span></td>
                <td><strong>{event.userName}</strong><small>{event.department}</small></td>
                <td><strong>{event.eventType}</strong><small>{event.promptSummary}</small></td>
                <td>{event.modelName}</td>
                <td><span className={`risk-status ${event.actionStatusType}`}>{event.actionStatus}</span></td>
                <td><button type="button" className="risk-view-button" onClick={() => setSelectedEventId(event.id)}><Eye size={15} />상세</button></td>
              </tr>
            ))}</tbody>
          </table>
          {filteredEvents.length === 0 && <div className="risk-events-empty">조건에 맞는 위험 이벤트가 없습니다.</div>}
        </div>
      </section>

      {selectedEvent && (
        <div className="risk-event-modal-backdrop" role="presentation" onMouseDown={() => setSelectedEventId(null)}>
          <section className="risk-event-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className={`risk-level ${selectedEvent.riskLevel.toLowerCase()}`}>{selectedEvent.riskLevel}</span><h3>{selectedEvent.eventType}</h3></div><button type="button" onClick={() => setSelectedEventId(null)}>닫기</button></header>
            <dl>
              <div><dt>사용자</dt><dd>{selectedEvent.userName} · {selectedEvent.department}</dd></div>
              <div><dt>발생 시각</dt><dd>{selectedEvent.occurredAt}</dd></div>
              <div><dt>사용 모델</dt><dd>{selectedEvent.modelName}</dd></div>
              <div><dt>조치 상태</dt><dd>{selectedEvent.actionStatus}</dd></div>
              <div className="wide"><dt>탐지 내용</dt><dd>{selectedEvent.promptSummary}</dd></div>
            </dl>
            <footer><button type="button" onClick={() => setSelectedEventId(null)}>확인</button></footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default ComplianceRiskEventsPage;
