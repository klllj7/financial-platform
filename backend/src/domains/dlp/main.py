from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from detector import detect_pii, mask_text, compute_grade, BLOCK_TYPES
from embedding_detector import detect_similarity
from db import SessionLocal
from models import UsageLog, EventLog, ActionHistory, User, Department
from enum import Enum

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    prompt: str
    # TODO: A 담당자의 로그인/JWT 붙으면 요청 바디 대신 토큰에서 추출하도록 교체
    user_id: Optional[int] = None

class ActionType(str, Enum):
    reviewed = "reviewed"
    escalated = "escalated"
    dismissed = "dismissed"

class ActionRequest(BaseModel):
    actor_user_id: int
    action_type: ActionType
    action_reason: str

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

    db = SessionLocal()
    try:
        usage_log = UsageLog(user_id=request.user_id, description=request.prompt[:200])
        db.add(usage_log)
        db.commit()
        db.refresh(usage_log)

        if detected:
            detection_type = ",".join(sorted(set(d["type"] for d in detected)))
            event_log = EventLog(
                event_id=usage_log.id,
                detection_type=detection_type,
                masked_yn=(action_status == "masked"),
                grade=compute_grade(detected),
            )
            db.add(event_log)

            action_history = ActionHistory(
                event_id = usage_log.id,
                actor_user_id = None,
                action_type = action_status,
                action_reason = "시스템 자동 감지"
            )
            db.add(action_history)

            db.commit()
    finally:
        db.close()

    if action_status == "blocked":
        if "prompt_injection" in blocked_types:
            reason = "프롬프트 인젝션·탈옥 시도가 감지되어"
        elif "confidential_similarity" in blocked_types:
            reason = "기밀·민감 내부정보와 유사한 내용이 감지되어"
        else:
            reason = "민감정보(주민등록번호)가 포함되어"
        return {
            "action_status": action_status,
            "message": f"{reason} 요청이 차단되었습니다.",
            "detected": detected,
        }
    return {
        "action_status": action_status,
        "prompt": response_prompt,
        "detected": detected,
    }

@app.post("/events/{event_id}/action")
def create_action(event_id: int, request: ActionRequest):
    db = SessionLocal()
    try:
        event = db.query(EventLog).filter(EventLog.event_id == event_id).first()
        if event is None:
            raise HTTPException(status_code=404, detail="해당 event_id의 이벤트를 찾을 수 없습니다.")
        
        action_history = ActionHistory(
            event_id = event_id,
            actor_user_id = request.actor_user_id,
            action_type = request.action_type.value,
            action_reason = request.action_reason
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
    finally:
        db.close()

@app.get("/events")
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

        # action_history를 한 번에 조회
        actions = (
            db.query(ActionHistory).filter(ActionHistory.event_id.in_(usage_log_ids)).all()
            if usage_log_ids else []
        )
        actions_by_event_id = {}
        for a in actions:
            actions_by_event_id.setdefault(a.event_id, []).append(a)

        result = []
        for event in events:
            usage_log = usage_log_by_id.get(event.event_id)
            user = user_by_id.get(usage_log.user_id) if usage_log and usage_log.user_id is not None else None
            department = department_by_id.get(user.department_id) if user and user.department_id is not None else None
            event_actions = actions_by_event_id.get(event.event_id, [])

            result.append({
                "event_id": event.event_id,
                "description": usage_log.description if usage_log else None,
                "user_name": user.name if user else None,
                "department_name": department.name if department else None,
                "detection_type": event.detection_type,
                "grade": event.grade,
                "masked_yn": event.masked_yn,
                "created_at": event.created_at,
                "actions": [
                    {
                        "action_type": a.action_type,
                        "action_reason": a.action_reason,
                        "actor_user_id": a.actor_user_id,
                        "action_time": a.action_time
                    }
                    for a in event_actions
                ]
            })
        return result
    finally:
        db.close()