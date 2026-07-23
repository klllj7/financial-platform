import { useEffect, useMemo, useState } from "react";
import { getEvents, postEventAction } from "../../../api/dlpApi";
import "./EventListPage.css";

// action_type 값과 화면에 보여줄 한글 라벨을 묶어서 관리
// (백엔드 main.py의 ActionType Enum과 값이 반드시 일치해야 함)
const ACTION_TYPES = [
  { value: "reviewed", label: "확인함" },
  { value: "escalated", label: "상급보고" },
  { value: "dismissed", label: "오탐/기각" },
];

// grade 값에 따라 배지 색을 다르게 보여주기 위한 매핑
const GRADE_CLASS = {
  HIGH: "badge badge-red",
  MEDIUM: "badge badge-amber",
  LOW: "badge badge-green",
};

// event.actions 배열의 가장 마지막 조치를 기준으로
// 시안에 있는 "조치상태" 라벨/배지 색을 결정한다.
// action_type 값은 시스템 자동(blocked/masked)과 수동(reviewed/escalated/dismissed)이 섞여 있다.
const ACTION_STATUS_MAP = {
  blocked: { label: "차단", className: "badge badge-blue" },
  masked: { label: "경고 발송", className: "badge badge-red" },
  reviewed: { label: "확인함", className: "badge badge-blue" },
  escalated: { label: "상급보고", className: "badge badge-red" },
  dismissed: { label: "오탐/기각", className: "badge badge-gray" },
};
const NO_ACTION_STATUS = { label: "조치없음", className: "badge badge-gray" };

const getActionStatus = (event) => {
  if (!event.actions || event.actions.length === 0) return NO_ACTION_STATUS;
  const latest = event.actions[event.actions.length - 1];
  return ACTION_STATUS_MAP[latest.action_type] ?? NO_ACTION_STATUS;
};

const formatEventId = (eventId) => `E${String(eventId).padStart(3, "0")}`;

function EventListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태 (부서 / 규제매핑여부는 아직 연결할 데이터가 없어 항상 "전체"로 고정)
  const [gradeFilter, setGradeFilter] = useState("전체");
  const [actionStatusFilter, setActionStatusFilter] = useState("전체");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 지금 "조치하기" 폼이 열려있는 event_id (한 번에 하나만 열리게 함)
  const [actioningEventId, setActioningEventId] = useState(null);
  const [actionType, setActionType] = useState(ACTION_TYPES[0].value);
  const [actionReason, setActionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = () => {
    setLoading(true);
    getEvents()
      .then((res) => setEvents(res.data))
      .finally(() => setLoading(false));
  };

  // 화면이 처음 뜰 때 한 번만 목록을 불러옴
  useEffect(() => {
    fetchEvents();
  }, []);

  const openActionForm = (eventId) => {
    setActioningEventId(eventId);
    setActionType(ACTION_TYPES[0].value);
    setActionReason("");
  };

  const closeActionForm = () => {
    setActioningEventId(null);
  };

  const handleSubmitAction = async (eventId) => {
    setSubmitting(true);
    try {
      await postEventAction(eventId, {
        // TODO: A 담당자의 로그인 기능이 완성되면 실제 로그인 사용자 id로 교체
        actor_user_id: 1,
        action_type: actionType,
        action_reason: actionReason,
      });
      closeActionForm();
      fetchEvents(); // 조치 후 목록을 다시 불러와 조치 이력을 최신 상태로 반영
    } catch (error) {
      console.error("조치 등록 실패:", error);
      alert("조치 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 필터 조건에 맞는 이벤트만 화면에 보여준다 (클라이언트에서 걸러내는 방식).
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (gradeFilter !== "전체" && event.grade !== gradeFilter) return false;

      const status = getActionStatus(event).label;
      if (actionStatusFilter !== "전체" && status !== actionStatusFilter) {
        return false;
      }

      const createdAt = new Date(event.created_at);
      if (dateFrom && createdAt < new Date(dateFrom)) return false;
      if (dateTo && createdAt > new Date(`${dateTo}T23:59:59`)) return false;

      return true;
    });
  }, [events, gradeFilter, actionStatusFilter, dateFrom, dateTo]);

  return (
    <div className="event-list-page">
      <h1>위험 이벤트 관리</h1>

      <div className="filter-bar">
        <div className="filter-field">
          <label>부서</label>
          <select disabled title="담당 도메인 데이터 연동 후 지원 예정">
            <option>전체</option>
          </select>
        </div>

        <div className="filter-field">
          <label>위험등급</label>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option>전체</option>
            <option>HIGH</option>
            <option>MEDIUM</option>
            <option>LOW</option>
          </select>
        </div>

        <div className="filter-field">
          <label>조치상태</label>
          <select
            value={actionStatusFilter}
            onChange={(e) => setActionStatusFilter(e.target.value)}
          >
            <option>전체</option>
            <option>차단</option>
            <option>경고 발송</option>
            <option>확인함</option>
            <option>상급보고</option>
            <option>오탐/기각</option>
            <option>조치없음</option>
          </select>
        </div>

        <div className="filter-field">
          <label>기간</label>
          <div className="filter-date-range">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span>~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-field">
          <label>규제매핑여부</label>
          <select disabled title="규제 매핑 도메인 데이터 연동 후 지원 예정">
            <option>전체</option>
          </select>
        </div>
      </div>

      <p className="event-count">{filteredEvents.length}건</p>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <table className="event-table">
          <thead>
            <tr>
              <th>이벤트ID</th>
              <th>사용자</th>
              <th>부서</th>
              <th>모델</th>
              <th>탐지유형</th>
              <th>위험등급</th>
              <th>조치상태</th>
              <th>규제매핑</th>
              <th>발생시각</th>
              <th>조치</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => {
              const status = getActionStatus(event);

              return (
                <tr key={event.event_id}>
                  <td>{formatEventId(event.event_id)}</td>
                  {/* TODO: user_info/department 테이블 연동 후 실제 값으로 교체 (A 담당자) */}
                  <td className="cell-placeholder">-</td>
                  <td className="cell-placeholder">-</td>
                  {/* TODO: ai_tool_info 연동 후 실제 값으로 교체 (B 담당자) */}
                  <td className="cell-placeholder">-</td>
                  <td>{event.detection_type}</td>
                  <td>
                    <span className={GRADE_CLASS[event.grade] ?? "badge"}>
                      {event.grade}
                    </span>
                  </td>
                  <td>
                    <span className={status.className}>{status.label}</span>
                  </td>
                  {/* TODO: event_clause_map 연동 후 실제 값으로 교체 (규제 매핑 담당자) */}
                  <td className="cell-placeholder">-</td>
                  <td>{new Date(event.created_at).toLocaleString()}</td>
                  <td>
                    {actioningEventId === event.event_id ? (
                      <div className="action-form">
                        <select
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value)}
                        >
                          {ACTION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          placeholder="조치 사유 입력"
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                        />

                        <div className="action-form-buttons">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSubmitAction(event.event_id)}
                          >
                            저장
                          </button>
                          <button type="button" onClick={closeActionForm}>
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="action-open-button"
                        onClick={() => openActionForm(event.event_id)}
                      >
                        조치하기
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EventListPage;
