from sqlalchemy import text

from db import Base, engine
import models

# create_all은 없는 테이블만 만들고 이미 있는 테이블에 컬럼을 추가하지는 않는다.
# 이 프로젝트에는 alembic이 없어서, 나중에 추가된 컬럼은 여기에 멱등한 ALTER로 적어둔다.
# 이미 있는 컬럼이면 아무 일도 일어나지 않으므로 몇 번 실행해도 안전하다.
MIGRATIONS = [
    # AI 응답(출력) 검사 결과를 사용자 입력 이벤트와 구분하기 위해 추가.
    "ALTER TABLE event_log ADD COLUMN IF NOT EXISTS direction VARCHAR DEFAULT 'input'",
    "ALTER TABLE event_log ADD COLUMN IF NOT EXISTS description VARCHAR",
    "ALTER TABLE event_log ADD COLUMN IF NOT EXISTS masked_description VARCHAR",
    "ALTER TABLE action_history ADD COLUMN IF NOT EXISTS direction VARCHAR",
    # 기존 데이터는 전부 입력 검사에서 생긴 것이다.
    "UPDATE event_log SET direction = 'input' WHERE direction IS NULL",
    # 위험 이벤트 화면에 실제 사용 모델을 표시하기 위해 추가.
    "ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS model_name VARCHAR",
]

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        for statement in MIGRATIONS:
            connection.execute(text(statement))
    print("tables created")
