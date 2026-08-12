from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from db import Base


class UsageLog(Base):
    """B 담당(LYA)이 확정할 실제 usage_log 테이블이 생기기 전까지 사용하는 로컬 테스트용 스텁."""
    __tablename__ = "usage_log"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True)
    # 원문. 컴플라이언스 담당자가 오탐 여부를 판단하거나 증빙자료로 써야 해서
    # 보관은 하되, 목록 화면 기본 노출은 마스킹본으로 하고 원문은 상세보기에서만 연다.
    description = Column(String)
    # 화면에 기본으로 보여줄 마스킹본. 탐지된 게 없으면 원문과 동일하다.
    masked_description = Column(String, nullable=True)
    # 이 요청에 실제로 쓰인 AI 모델의 표시 이름(예: "Claude Haiku 4.5").
    # 입력 검사 시점에는 아직 AI를 호출하기 전이라 비어있고, 출력 검사 호출 때
    # Node가 실제 호출 결과를 같이 보내주면 그때 채워진다. AI 호출 자체가 없었던
    # 경우(예: 입력이 차단됨)는 계속 NULL로 남는다.
    model_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    """A 담당자가 Node/Sequelize로 만든 users 테이블을 읽기 전용으로 매핑 (같은 financial_platform DB 공유)."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    department_id = Column(Integer, ForeignKey("department.id"))


class Department(Base):
    """A 담당자가 Node/Sequelize로 만든 department 테이블을 읽기 전용으로 매핑."""
    __tablename__ = "department"

    id = Column(Integer, primary_key=True)
    name = Column(String)


class EventLog(Base):
    __tablename__ = "event_log"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("usage_log.id"), nullable=False)
    detection_type = Column(String)
    masked_yn = Column(Boolean, default=False)
    grade = Column(String)
    # Embedding Similarity 탐지의 근거(코사인 유사도)를 감사용으로 남긴다.
    # 정규식 탐지만 걸린 경우엔 값이 없다(NULL).
    similarity_score = Column(Float, nullable=True)
    # 사용자 입력에서 탐지된 것("input")인지 AI 응답에서 탐지된 것("output")인지.
    # 하나의 usage_log(=한 번의 대화 요청)에 입력 이벤트와 출력 이벤트가
    # 각각 최대 1건씩 달릴 수 있어서, 둘을 구분하려면 이 값이 필요하다.
    direction = Column(String, nullable=False, default="input")
    # 출력("output") 이벤트에서 탐지된 AI 응답 본문. AI 응답은 usage_log에 남기지
    # 않으므로(그건 사용자의 사용 이력이 아니다) 여기에 보관한다.
    # 입력 이벤트는 usage_log 쪽 컬럼을 쓰기 때문에 둘 다 NULL이다.
    #
    # usage_log와 같은 규칙이다 — 목록 기본 노출은 마스킹본, 원문은 상세보기에서만.
    # confidential_similarity는 문장 전체가 마스킹되어 마스킹본이 별표만 남기 때문에,
    # 원문이 없으면 담당자가 오탐 여부를 판단할 수단이 아예 없어진다.
    description = Column(String, nullable=True)
    masked_description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RegulationDocument(Base):
    """D 담당자가 Node/Sequelize로 만든 regulation_document 테이블을 읽기 전용으로 매핑."""
    __tablename__ = "regulation_document"

    id = Column(Integer, primary_key=True)
    doc_name = Column(String)


class RegulationClause(Base):
    """D 담당자가 Node/Sequelize로 만든 regulation_clause 테이블을 읽기 전용으로 매핑.
    regulation_mapping.py가 detection_type별 근거 조항의 실제 제목을 조회하는 데 쓴다."""
    __tablename__ = "regulation_clause"

    id = Column(Integer, primary_key=True)
    doc_id = Column(Integer, ForeignKey("regulation_document.id"))
    clause_no = Column(String)
    title = Column(String)


class ActionHistory(Base):
    __tablename__ = "action_history"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("usage_log.id"), nullable=False)
    actor_user_id = Column(Integer)  # user_info 테이블 생기면 ForeignKey로 변경
    action_type = Column(String)
    action_reason = Column(String)
    # 시스템 자동 조치가 입력·출력 중 어느 쪽에서 나온 것인지.
    # 담당자가 직접 남기는 수동 조치(reviewed/escalated/dismissed)는 요청 전체에
    # 대한 판단이라 NULL로 두고, 조회 시 입력·출력 양쪽 이벤트에 모두 표시한다.
    direction = Column(String, nullable=True)
    action_time = Column(DateTime(timezone=True), server_default=func.now())
