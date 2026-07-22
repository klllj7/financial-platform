from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from detector import detect_pii, mask_text
from db import SessionLocal
from models import UsageLog, EventLog, ActionHistory
from detector import compute_grade
from enum import Enum

app = FastAPI()

@app.get("/health")
def health_check():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    prompt: str

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
    detected = detect_pii(request.prompt)

    if any(d["type"] == "resident_number" for d in detected):
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
        usage_log = UsageLog(description=request.prompt[:200])
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
        return {
            "action_status": action_status,
            "message": "민감정보(주민등록번호)가 포함되어 요청이 차단되었습니다.",
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