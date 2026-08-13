import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock3, Search, ShieldAlert } from "lucide-react";

import { getEvents, postEventAction } from "../../../api/dlpApi";
import { formatDetectionType } from "../../../utils/detectionType";
import { maskName } from "../../../utils/maskName";
import "./ComplianceRiskEventsPage.css";

const RISK_FILTERS = ["전체", "HIGH", "MEDIUM", "LOW"];
const STATUS_FILTERS = ["전체", "미조치", "조치 중", "모니터링", "조치 완료"];

// 이 화면의 조치 상태(4단계)와 DLP 백엔드의 action_type을 매핑한다.
// (백엔드는 escalated/dismissed/reviewed 3가지 수동 조치만 구분하므로 근사치로 매핑)
const ACTION_STATUS_BY_TYPE = {
  escalated: { label: "조치 중", type: "processing" },
  dismissed: { label: "조치 완료", type: "completed" },
  reviewed: { label: "모니터링", type: "monitoring" },
};
const NO_ACTION_STATUS = { label: "미조치", type: "none" };

// 이력 목록에는 자동 조치까지 나오므로 별도 라벨 맵이 필요하다.
const ACTION_HISTORY_LABELS = {
  blocked: "자동 차단",
  masked: "자동 마스킹",
  allowed: "자동 허용",
  reviewed: "모니터링",
  escalated: "조치 중",
  dismissed: "조치 완료",
};

const deriveActionStatus = (actions = []) => {
  const manualActions = actions.filter((a) =>
    ["reviewed", "escalated", "dismissed"].includes(a.action_type),
  );
  if (manualActions.length === 0) return NO_ACTION_STATUS;
  const latest = manualActions[manualActions.length - 1];
  return ACTION_STATUS_BY_TYPE[latest.action_type] ?? NO_ACTION_STATUS;
};

const formatOccurredAt = (isoString) => {
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// LoginPage에서 로그인 성공 시 localStorage에 저장해두는 사용자 정보에서 userId를 꺼낸다.
const getLoggedInUserId = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.userId ?? null;
  } catch {
    return null;
  }
};

// 조치 시 백엔드로 보낼 action_type 값과 화면에 보여줄 한글 라벨
const ACTION_FORM_TYPES = [
  { value: "reviewed", label: "모니터링" },
  { value: "escalated", label: "조치 중" },
  { value: "dismissed", label: "조치 완료" },
];

function ComplianceRiskEventsPage() {
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [riskFilter, setRiskFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [departmentFilter, setDepartmentFilter] = useState("전체");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(
    location.state?.selectedEventId ?? null,
  );
  const [showRawText, setShowRawText] = useState(false);
  // 규제 뱃지를 클릭해서 열어본 위반 항목 (법적 문제점/대응 조치 팝업용)
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [actionType, setActionType] = useState(ACTION_FORM_TYPES[0].value);
  const [actionReason, setActionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = () => {
    setLoading(true);

    getEvents()
      .then((res) => {
        const mapped = res.data.map((event) => {
          const status = deriveActionStatus(event.actions);
          const createdAt = new Date(event.created_at);
          return {
            // 한 번의 대화 요청(usage_log)에 사용자 입력 이벤트와 AI 응답 이벤트가
            // 각각 달릴 수 있어서 event_id는 행마다 고유하지 않다. 목록 key와 선택
            // 상태에는 event_log.id를 쓰고, 조치 등록 API에만 event_id를 쓴다.
            id: event.id ?? event.event_id,
            eventId: event.event_id,
            direction: event.direction ?? "input",
            riskLevel: event.grade,
            // 원본 이름. 반복 위험 판별(getRecentUserEventCount)·최신행 판별(seenUserNames)·
            // 검색에서 동일인 비교 키로만 쓰고, 화면에는 절대 렌더링하지 않는다.
            // (마스킹된 값끼리는 서로 다른 사람이 같은 문자열로 겹칠 수 있어 비교 키로 쓰면 안 됨)
            userName: event.user_name ?? "-",
            userNameMasked: maskName(event.user_name),
            department: event.department_name ?? "-",
            eventType: event.detection_type,
            // AI가 실제로 호출된 경우에만 채워진다. 입력 단계에서 차단된 요청처럼
            // 애초에 AI를 부르지 않은 이벤트는 백엔드도 값을 안 주므로 "-"로 남는다.
            modelName: event.model_name ?? "-",
            // 목록/기본 노출은 마스킹본으로 하고, 원문은 상세보기에서 토글로만 연다.
            maskedPromptSummary: event.masked_description ?? event.description,
            // AI 응답에서 탐지된 이벤트는 원문을 저장하지 않으므로 마스킹본으로 대체한다.
            rawPromptSummary: event.description ?? event.masked_description,
            similarityScore: event.similarity_score,
            // RAG 규제매핑 결과. 아직 백엔드가 안 내려줄 수도 있어서 빈 배열로 안전하게 처리한다.
            // (modelName처럼, 다른 담당자의 백엔드 작업이 끝나면 실제 값이 채워짐)
            mappedViolations: event.mapped_violations ?? [],
            actionStatus: status.label,
            actionStatusType: status.type,
            occurredAt: formatOccurredAt(event.created_at),
            createdAt,
            actions: (event.actions ?? []).map((action) => ({
              id: action.id,
              label: ACTION_HISTORY_LABELS[action.action_type] ?? action.action_type,
              reason: action.action_reason,
              // actorName은 비교/검색 용도가 없어 매핑 단계에서 바로 마스킹한다.
              // 담당자 이름이 아예 없는 자동 조치는 기존처럼 "담당자"로 표시.
              actorName: action.actor_name ? maskName(action.actor_name) : "담당자",
              // 담당자 수동 조치는 direction이 null로 내려온다.
              isAuto: action.direction != null,
              actedAt: formatOccurredAt(action.action_time),
            })),
          };
        });
        setEvents(mapped);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // 첫 화면 진입 시 DLP 백엔드의 실제 위험 이벤트를 조회한다.
    queueMicrotask(fetchEvents);
  }, []);

  // 목록에 실제로 나타난 부서만 선택지로 보여준다.
  const departmentOptions = useMemo(() => {
    const unique = new Set(events.map((event) => event.department).filter(Boolean));
    return ["전체", ...Array.from(unique).sort()];
  }, [events]);

  // 반복 위험 발생 여부를 확인할 기간
  const REPEAT_RISK_PERIOD_DAYS = 30;

  /*
  * 선택한 이벤트 발생일을 기준으로 이전 30일 동안
  * 동일 사용자에게 발생한 위험 이벤트 건수를 계산한다.
  *
  * 달력 기준이 아니라 각 이벤트 시점 기준으로 계산하기 때문에
  * 월이 바뀌어도 최근 발생 빈도를 일관되게 확인할 수 있다.
  */
  const getRecentUserEventCount = (targetEvent) => {
    const periodStart = new Date(targetEvent.createdAt);

    periodStart.setDate(
      periodStart.getDate() - REPEAT_RISK_PERIOD_DAYS,
    );

    return events.filter((event) => {
      const isSameUser = event.userName === targetEvent.userName;

      const isWithinPeriod =
        event.createdAt >= periodStart &&
        event.createdAt <= targetEvent.createdAt;

      return isSameUser && isWithinPeriod;
    }).length;
  };

  const filteredEvents = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return events.filter((event) => {
      const text = [event.userName, event.department, formatDetectionType(event.eventType), event.modelName, event.maskedPromptSummary]
        .join(" ")
        .toLowerCase();
      return (riskFilter === "전체" || event.riskLevel === riskFilter)
        && (statusFilter === "전체" || event.actionStatus === statusFilter)
        && (departmentFilter === "전체" || event.department === departmentFilter)
        && (!from || event.createdAt >= from)
        && (!to || event.createdAt <= to)
        && (!query || text.includes(query));
    });
  }, [events, keyword, riskFilter, statusFilter, departmentFilter, dateFrom, dateTo]);

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const isSelectedEventCompleted = selectedEvent?.actionStatus === "조치 완료";
  const countBy = (key, value) => events.filter((event) => event[key] === value).length;

  const openEventDetail = (eventId) => {
    setSelectedEventId(eventId);
    setActionType(ACTION_FORM_TYPES[0].value);
    setActionReason("");
    setShowRawText(false);
    setSelectedViolation(null);
  };

  const handleSubmitAction = async () => {
    if (!selectedEvent) return;
    
    // 완료된 이벤트에 대해서는 추가 조치 이력을 등록하지 않는다.
    if (isSelectedEventCompleted) {
      alert("이미 조치 완료된 이벤트는 수정할 수 없습니다.");
      return;
    }

    const trimmedReason = actionReason.trim();

    // 감사 이력에 조치 근거가 반드시 남도록 사유 입력을 필수로 검증한다.
    if (!trimmedReason) {
      alert("조치 사유를 입력해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      // 조치는 요청 단위(usage_log)로 남기므로 event_log.id가 아니라 event_id를 보낸다.
      await postEventAction(selectedEvent.eventId, {
        actor_user_id: getLoggedInUserId(),
        action_type: actionType,
        action_reason: trimmedReason,
      });
      
      // 모달을 닫지 않고 이력만 갱신해서, 방금 남긴 사유가 바로 보이게 한다.
      setActionType(ACTION_FORM_TYPES[0].value);
      setActionReason("");
      fetchEvents();

      fetchEvents();
    } catch (error) {
      console.error("조치 등록 실패:", error);

      const message = error.response?.data?.detail ?? "조치 등록에 실패했습니다.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

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
          <label><span>부서</span><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            {departmentOptions.map((department) => <option key={department}>{department}</option>)}
          </select></label>
          <label className="risk-events-date-range">
            <span>기간</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <span>~</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
        </div>

        {loading ? (
          <div className="risk-events-empty">불러오는 중...</div>
        ) : (
          <div className="risk-events-table-wrap">
            <table className="risk-events-table">
              <thead><tr><th>발생 시각</th><th>위험 등급</th><th>사용자 / 부서</th><th>탐지 유형</th><th>사용 모델</th><th>조치 상태</th><th /></tr></thead>
              {/*
                filteredEvents는 최신순으로 정렬되어 있어서, 같은 사용자의
                행 중 맨 처음 만나는 것이 그 사용자의 가장 최근 이벤트다.
                배지를 매 행마다 반복해서 붙이면 같은 사람이 여러 번 뱃지를
                달고 나와 지저분해 보이므로, 그 최신 행 하나에만 표시한다.
              */}
              <tbody>{(() => {
                const seenUserNames = new Set();
                return filteredEvents.map((event) => {
                const recentEventCount = getRecentUserEventCount(event);
                const isLatestForUser = !seenUserNames.has(event.userName);
                seenUserNames.add(event.userName);
                return (
                <tr key={event.id}>
                  <td>{event.occurredAt}</td>
                  <td><span className={`risk-level ${event.riskLevel.toLowerCase()}`}>{event.riskLevel}</span></td>
                  <td>
                    <strong>{event.userNameMasked}</strong>
                    <small>{event.department}</small>
                    {recentEventCount > 2 && isLatestForUser && (
                      <span 
                        className="risk-repeat-badge" 
                        title={`해당 이벤트 발생일 기준 최근 ${REPEAT_RISK_PERIOD_DAYS}일 동안 동일 사용자에게 탐지된 위험 이벤트 건수`}
                      >
                        최근 {REPEAT_RISK_PERIOD_DAYS}일 {recentEventCount}건
                      </span>
                    )}
                  </td>
                  <td><strong>{formatDetectionType(event.eventType)}</strong></td>
                  <td>{event.modelName}</td>
                  <td><span className={`risk-status ${event.actionStatusType}`}>{event.actionStatus}</span></td>
                  <td>
                    <button
                      type="button"
                      className="risk-view-button"
                      onClick={() => openEventDetail(event.id)}
                    >
                      상세
                    </button>
                  </td>
                </tr>
                );
              });
              })()}</tbody>
            </table>
            {filteredEvents.length === 0 && <div className="risk-events-empty">조건에 맞는 위험 이벤트가 없습니다.</div>}
          </div>
        )}
      </section>

      {selectedEvent && (
        <div className="risk-event-modal-backdrop" role="presentation" onMouseDown={() => setSelectedEventId(null)}>
          <section className="risk-event-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <header><div><span className={`risk-level ${selectedEvent.riskLevel.toLowerCase()}`}>{selectedEvent.riskLevel}</span><h3>{formatDetectionType(selectedEvent.eventType)}</h3></div><button type="button" onClick={() => setSelectedEventId(null)}>닫기</button></header>
            <dl>
              <div><dt>사용자</dt><dd>{selectedEvent.userNameMasked} · {selectedEvent.department}</dd></div>
              <div><dt>발생 시각</dt><dd>{selectedEvent.occurredAt}</dd></div>
              <div><dt>탐지 위치</dt><dd>{selectedEvent.direction === "output" ? "AI 응답" : "사용자 입력"}</dd></div>
              <div><dt>사용 모델</dt><dd>{selectedEvent.modelName}</dd></div>
              <div><dt>조치 상태</dt><dd>{selectedEvent.actionStatus}</dd></div>
              {getRecentUserEventCount(selectedEvent) > 1 && (
                <div>
                  <dt>최근 반복 탐지</dt>
                  <dd>
                    최근 {REPEAT_RISK_PERIOD_DAYS}일 동안 동일 사용자{" "}
                    {getRecentUserEventCount(selectedEvent)}건
                  </dd>
                </div>
              )}
              {selectedEvent.similarityScore != null && (
                <div><dt>탐지 신뢰도(유사도)</dt><dd>{(selectedEvent.similarityScore * 100).toFixed(1)}%</dd></div>
              )}
              <div className="wide">
                <dt>
                  탐지 내용
                  <button
                    type="button"
                    className="risk-raw-toggle-button"
                    onClick={() => setShowRawText((prev) => !prev)}
                  >
                    {showRawText ? "마스킹본 보기" : "원문 보기"}
                  </button>
                </dt>
                <dd>{showRawText ? selectedEvent.rawPromptSummary : selectedEvent.maskedPromptSummary}</dd>
              </div>
              {selectedEvent.mappedViolations.length > 0 && (
                <div className="wide">
                  <dt>관련 규제 조항</dt>
                  <dd className="risk-regulation-badge-list">
                    {selectedEvent.mappedViolations.map((violation) => (
                      <button
                        key={violation.regulation_code}
                        type="button"
                        className={`risk-regulation-badge severity-${violation.severity.toLowerCase()}`}
                        onClick={() => setSelectedViolation(violation)}
                      >
                        📖 {violation.law_name}
                      </button>
                    ))}
                  </dd>
                </div>
              )}
              {selectedEvent.actions.length > 0 && (
                <div className="wide">
                  <dt>조치 이력</dt>
                  <dd>
                    <ol className="risk-action-history">
                      {selectedEvent.actions.map((action) => (
                        <li key={action.id} className={action.isAuto ? "auto" : ""}>
                          <div>
                            <span className="risk-action-history-label">{action.label}</span>
                            <time>{action.actedAt}</time>
                            {!action.isAuto && <span>{action.actorName}</span>}
                          </div>
                          <p>{action.reason}</p>
                        </li>
                      ))}
                    </ol>
                  </dd>
                </div>
              )}              
            </dl>

            <div className="risk-event-action-form">
              {isSelectedEventCompleted && (
                <div className="risk-action-locked-message">
                  <CheckCircle2 size={16} />

                  <div>
                    <strong>조치가 완료된 이벤트입니다.</strong>
                    <p>
                      감사 이력 보호를 위해 완료 이후에는
                      조치 유형과 사유를 변경할 수 없습니다.
                    </p>
                  </div>
                </div>
              )}
              <label>
                조치 유형
                <select value={actionType} onChange={(event) => setActionType(event.target.value)} disabled={isSelectedEventCompleted}>
                  {ACTION_FORM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  조치 사유
                  <em className="risk-action-required">*</em>
                </span>
                <textarea
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  placeholder="조치 근거와 처리 내용을 입력하세요"
                  required
                  disabled={isSelectedEventCompleted}
                />
              </label>
            </div>

            <footer>
              <button 
                type="button" 
                disabled={
                  submitting || isSelectedEventCompleted || !actionReason.trim()
                } 
                onClick={handleSubmitAction}
              >
                {isSelectedEventCompleted
                  ? "조치 완료됨"
                  : submitting
                    ? "저장 중..."
                    : "조치 저장"}
              </button>
            </footer>
          </section>
        </div>
      )}

      {selectedViolation && (
        <div
          className="risk-violation-popup-backdrop"
          role="presentation"
          onMouseDown={() => setSelectedViolation(null)}
        >
          <section
            className="risk-violation-popup"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <span className={`risk-regulation-badge severity-${selectedViolation.severity.toLowerCase()}`}>
                📖 {selectedViolation.law_name}
              </span>
              <button type="button" onClick={() => setSelectedViolation(null)}>닫기</button>
            </header>
            <dl>
              <div>
                <dt>법적 문제점</dt>
                <dd>{selectedViolation.legal_issue}</dd>
              </div>
              <div>
                <dt>대응 조치</dt>
                <dd>{selectedViolation.recommended_action}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}

export default ComplianceRiskEventsPage;
