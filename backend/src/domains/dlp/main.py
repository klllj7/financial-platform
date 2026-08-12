from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from detector import detect_pii, mask_text, compute_grade, BLOCK_TYPES
from embedding_detector import detect_similarity
from db import SessionLocal
from models import UsageLog, EventLog, ActionHistory, User, Department
from regulation_mapping import get_mapped_violations, build_clause_law_names
from enum import Enum

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    prompt: str
    # TODO: A 담당자의 로그인/JWT 붙으면 요청 바디 대신 토큰에서 추출하도록 교체
    user_id: Optional[int] = None
    # "input"  = 사용자가 보낸 프롬프트 검사. usage_log를 새로 만든다.
    # "output" = AI가 생성한 응답 검사. AI 응답은 사용자의 "사용 이력"이 아니므로
    #            usage_log를 만들지 않고, 같은 요청의 usage_log에 이벤트만 덧붙인다.
    direction: Literal["input", "output"] = "input"
    # direction="output"일 때 입력 검사에서 받은 usage_log_id를 그대로 넘겨준다.
    usage_log_id: Optional[int] = None

class ActionType(str, Enum):
    reviewed = "reviewed"
    escalated = "escalated"
    dismissed = "dismissed"

class ActionRequest(BaseModel):
    actor_user_id: int
    action_type: ActionType
    action_reason: str

    @field_validator("action_reason")
    @classmethod
    def validate_action_reason(cls, value: str) -> str:
        """
        감사 이력에는 조치 근거가 반드시 남아야 하므로 
        빈 문자열이나 공백만 입력된 사유는 허용하지 않는다.
        """

        trimmed_value = value.strip()

        if not trimmed_value:
            raise ValueError("조치 사유는 필수입니다.")

        return trimmed_value

def get_latest_manual_action(db, event_id: int):
    """
    담당자가 직접 등록한 수동 조치 중 가장 최근 기록을 반환한다.

    시스템 자동 조치인 allowed, masked, blocked는 direction 값이 있고,
    담당자 수동 조치인 reviewed, escalated, dismissed는 direction이 NULL이다.
    """
    return (
        db.query(ActionHistory)
        .filter(
            ActionHistory.event_id == event_id,
            ActionHistory.direction.is_(None),
            ActionHistory.action_type.in_(
                ["reviewed", "escalated", "dismissed"]
            ),
        )
        .order_by(
            ActionHistory.action_time.desc(),
            ActionHistory.id.desc(),
        )
        .first()
    )

def _record_detection(db, usage_log_id: int, direction: str, detected: list[dict],
                      action_status: str, text: str, masked_text: str) -> None:
    """탐지 결과를 event_log/action_history에 남긴다. usage_log는 건드리지 않는다."""
    detection_type = ",".join(sorted(set(d["type"] for d in detected)))
    similarity_scores = [d["score"] for d in detected if "score" in d]
    # 입력 이벤트의 본문은 usage_log에 이미 있으므로 중복 저장하지 않는다.
    is_output = direction == "output"

    db.add(EventLog(
        event_id=usage_log_id,
        detection_type=detection_type,
        masked_yn=(action_status == "masked"),
        grade=compute_grade(detected),
        similarity_score=max(similarity_scores) if similarity_scores else None,
        direction=direction,
        description=text[:200] if is_output else None,
        masked_description=masked_text[:200] if is_output else None,
    ))
    db.add(ActionHistory(
        event_id=usage_log_id,
        actor_user_id=None,
        action_type=action_status,
        action_reason="시스템 자동 감지",
        direction=direction,
    ))
    db.commit()


@app.post("/gateway/chat")
def gateway_chat(request: ChatRequest):
    detected = detect_pii(request.prompt) + detect_similarity(request.prompt)
    blocked_types = sorted({d["type"] for d in detected if d["type"] in BLOCK_TYPES})

    if blocked_types:
        action_status = "blocked"
        response_prompt = None
    elif detected:
        action_status = "masked"
        response_prompt = mask_text(request.prompt, detected)
    else:
        action_status = "allowed"
        response_prompt = request.prompt

    masked_description = mask_text(request.prompt, detected) if detected else request.prompt
    usage_log_id = request.usage_log_id

    db = SessionLocal()
    try:
        if request.direction == "input":
            # 사용자가 실제로 보낸 요청만 사용 이력으로 남긴다.
            usage_log = UsageLog(
                user_id=request.user_id,
                description=request.prompt[:200],
                masked_description=masked_description[:200],
            )
            db.add(usage_log)
            db.commit()
            db.refresh(usage_log)
            usage_log_id = usage_log.id

        # direction="output"인데 usage_log_id가 없으면(입력 검사 단계에서 DLP가
        # 죽어 있었던 경우 등) 붙일 곳이 없다. 이때는 기록만 건너뛰고 차단·마스킹
        # 판정은 그대로 돌려준다 — 로그를 못 남긴다고 보호까지 풀 이유는 없다.
        if detected and usage_log_id is not None:
            _record_detection(
                db, usage_log_id, request.direction, detected,
                action_status, request.prompt, masked_description,
            )
    finally:
        db.close()

    response = {
        "action_status": action_status,
        "detected": detected,
        "usage_log_id": usage_log_id,
        "logged": not detected or usage_log_id is not None,
    }

    if action_status == "blocked":
        if "prompt_injection" in blocked_types:
            reason = "프롬프트 인젝션·탈옥 시도가 감지되어"
        elif "confidential_similarity" in blocked_types:
            reason = "기밀·민감 내부정보와 유사한 내용이 감지되어"
        else:
            reason = "민감정보(주민등록번호)가 포함되어"
        response["message"] = f"{reason} 요청이 차단되었습니다."
        return response

    response["prompt"] = response_prompt
    return response

# 프론트는 CloudFront의 /dlp-api/* 경로로 이 두 엔드포인트를 호출하는데, ALB 리스너
# 규칙은 경로를 벗기지 않고 그대로 넘기므로 /dlp-api 접두사가 붙은 경로도 같이 열어둔다.
# (Node -> DLP 서버 간 내부 호출(chat.service.js의 /gateway/chat 등)은 접두사 없이
#  DLP_SERVICE_URL로 직접 붙으므로 원래 경로는 그대로 유지한다)
@app.post("/events/{event_id}/action")
@app.post("/dlp-api/events/{event_id}/action")
def create_action(event_id: int, request: ActionRequest):
    db = SessionLocal()
    try:
        # 전달받은 event_id에 해당하는 위험 이벤트가 실제로 존재하는지 확인
        event = (db.query(EventLog).filter(EventLog.event_id == event_id).first())
        
        if event is None:
            raise HTTPException(status_code=404, detail="해당 event_id의 이벤트를 찾을 수 없습니다.")
        
        # 가장 최근 수동 조치가 완료 상태인지 확인
        latest_manual_action = get_latest_manual_action(
            db,
            event_id,
        )

        # 완료 처리된 이벤트는 감사 이력 보호를 위해 다시 수정하지 못하게 함
        if (latest_manual_action is not None and latest_manual_action.action_type == "dismissed"):
            raise HTTPException(status_code=409, detail="이미 조치 완료된 이벤트에는 추가 조치를 등록할 수 없습니다.", )
        
        # 검증이 끝난 경우에만 새로운 수동 조치 이력을 저장
        action_history = ActionHistory(
            event_id = event_id,
            actor_user_id = request.actor_user_id,
            action_type = request.action_type.value,
            action_reason = request.action_reason,
            direction=None,
        )

        db.add(action_history)
        db.commit()
        db.refresh(action_history)

        return {
            "id": action_history.id,
            "event_id": action_history.event_id,
            "actor_user_id": action_history.actor_user_id,
            "action_type": action_history.action_type,
            "action_reason": action_history.action_reason,
            "action_time": action_history.action_time,
        }
      
    except HTTPException:
        # 이미 정의한 404, 409 오류는 그대로 프론트에 전달
        raise

    except Exception as error:
        # 저장 중 오류가 발생하면 세션 상태를 원래대로 되돌림
        db.rollback()

        print(f"조치 이력 등록 실패: {error}")

        raise HTTPException(status_code=500, detail="조치 이력 등록 중 오류가 발생했습니다.", )
    
    finally:
        db.close()

@app.get("/events")
@app.get("/dlp-api/events")
def list_events():
    db = SessionLocal()
    try:
        events = db.query(EventLog).order_by(EventLog.created_at.desc()).all()

        usage_log_ids = [event.event_id for event in events]

        # usage_log를 한 번에 조회
        usage_logs = (
            db.query(UsageLog).filter(UsageLog.id.in_(usage_log_ids)).all()
            if usage_log_ids else []
        )
        usage_log_by_id = {u.id: u for u in usage_logs}

        # user를 한 번에 조회
        user_ids = {u.user_id for u in usage_logs if u.user_id is not None}
        users = (
            db.query(User).filter(User.id.in_(user_ids)).all()
            if user_ids else []
        )
        user_by_id = {u.id: u for u in users}

        # department를 한 번에 조회
        department_ids = {u.department_id for u in users if u.department_id is not None}
        departments = (
            db.query(Department).filter(Department.id.in_(department_ids)).all()
            if department_ids else []
        )
        department_by_id = {d.id: d for d in departments}

        # action_history를 한 번에 조회 (오래된 순 → 최신 순)
        actions = (
            db.query(ActionHistory)
            .filter(ActionHistory.event_id.in_(usage_log_ids))
            .order_by(ActionHistory.action_time, ActionHistory.id)
            .all()
            if usage_log_ids else []
        )
        actions_by_event_id = {}
        
        # 조치자 이름 표시용. 이벤트 발생자와 조치자가 다를 수 있어 빠진 사람만 추가로 조회한다.
        actor_ids = {a.actor_user_id for a in actions if a.actor_user_id is not None}
        missing_actor_ids = actor_ids - set(user_by_id)
        if missing_actor_ids:
            for u in db.query(User).filter(User.id.in_(missing_actor_ids)).all():
                user_by_id[u.id] = u

        for a in actions:
            actions_by_event_id.setdefault(a.event_id, []).append(a)

        clause_law_names = build_clause_law_names(db)

        result = []
        for event in events:
            usage_log = usage_log_by_id.get(event.event_id)
            user = user_by_id.get(usage_log.user_id) if usage_log and usage_log.user_id is not None else None
            department = department_by_id.get(user.department_id) if user and user.department_id is not None else None
            event_actions = actions_by_event_id.get(event.event_id, [])

            # 출력 이벤트가 탐지한 건 AI 응답이지 사용자가 입력한 프롬프트가 아니다.
            # 응답 본문은 event_log에 따로 들고 있으므로 그걸 우선 보여준다.
            if event.direction == "output":
                description = event.description
                masked_description = event.masked_description
            else:
                description = usage_log.description if usage_log else None
                masked_description = usage_log.masked_description if usage_log else None

            result.append({
                # 하나의 usage_log에 입력·출력 이벤트가 함께 달릴 수 있어서
                # event_id만으로는 행을 특정할 수 없다. event_log.id를 함께 내려준다.
                "id": event.id,
                "event_id": event.event_id,
                "direction": event.direction,
                "description": description,
                "masked_description": masked_description,
                "user_name": user.name if user else None,
                "department_name": department.name if department else None,
                "detection_type": event.detection_type,
                "grade": event.grade,
                "masked_yn": event.masked_yn,
                "similarity_score": event.similarity_score,
                "mapped_violations": get_mapped_violations(event.detection_type, clause_law_names),
                "created_at": event.created_at,
                "actions": [
                    {
                        "id": a.id,
                        "action_type": a.action_type,
                        "action_reason": a.action_reason,
                        "actor_user_id": a.actor_user_id,
                        # 자동 조치는 input/output 값이, 담당자 수동 조치는 None이 들어온다.
                        "actor_name": (
                            user_by_id[a.actor_user_id].name
                            if a.actor_user_id in user_by_id else None
                        ),
                        "direction": a.direction,
                        "action_time": a.action_time
                    }
                    # 자동 조치는 자기 방향 것만, 담당자의 수동 조치(direction=NULL)는
                    # 요청 전체에 대한 판단이라 입력·출력 양쪽에 모두 표시한다.
                    for a in event_actions
                    if a.direction is None or a.direction == event.direction
                ]
            })
        return result
    finally:
        db.close()