from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from db import Base


class UsageLog(Base):
    """B 담당(LYA)이 확정할 실제 usage_log 테이블이 생기기 전까지 사용하는 로컬 테스트용 스텁."""
    __tablename__ = "usage_log"

    id = Column(Integer, primary_key=True)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EventLog(Base):
    __tablename__ = "event_log"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("usage_log.id"), nullable=False)
    detection_type = Column(String)
    masked_yn = Column(Boolean, default=False)
    grade = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ActionHistory(Base):
    __tablename__ = "action_history"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("usage_log.id"), nullable=False)
    actor_user_id = Column(Integer)  # user_info 테이블 생기면 ForeignKey로 변경
    action_type = Column(String)
    action_reason = Column(String)
    action_time = Column(DateTime(timezone=True), server_default=func.now())
