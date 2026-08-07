# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# psycopg2-binary는 wheel로 설치되므로 별도 빌드 툴체인 불필요.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# embedding_detector.py가 모듈 로드 시점에 내려받는 임베딩 모델을 빌드 단계에서
# 미리 캐시에 구워둔다. 실측 결과 컨테이너 최초 기동 시 이 다운로드에만 15분이
# 걸려 배포(태스크 교체·오토스케일링)마다 반복되는 것이 확인되어, 빌드 시 1회만
# 받도록 전환. 소스 코드보다 먼저 실행해 코드만 바뀌어도 이 레이어가 캐시로 재사용되게 함.
RUN python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='intfloat/multilingual-e5-large')"

COPY . .

EXPOSE 8000

# Node 쪽 DLP_SERVICE_URL 기본값(http://localhost:8000)과 맞춘 포트
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
