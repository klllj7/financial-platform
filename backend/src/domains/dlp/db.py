import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# DATABASE_URL을 통째로 주면 그걸 쓰고(Neon 등 공유 DB 연결 문자열),
# 없으면 로컬 개발용 기본값(DB_* 조각)으로 조립한다.
DATABASE_URL = os.getenv("DATABASE_URL") or (
    f"postgresql://{os.getenv('DB_USER', 'fpuser')}:{os.getenv('DB_PASSWORD', 'fppassword')}"
    f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'financial_platform')}"
)

# Neon 같은 서버리스 DB는 오래 쓰지 않으면 연결을 끊어버려서,
# 매 요청 전에 살아있는지 확인하고 죽었으면 재연결하도록 pool_pre_ping을 켠다.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()