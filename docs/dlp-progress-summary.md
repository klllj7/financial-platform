# DLP 도메인 작업 요약 (2026-07-29 기준)

담당: C (DLP 탐지·조치 도메인) — 새 채팅/다른 창으로 이어가기 위한 컨텍스트 정리.

## 1. 스택

- DLP 백엔드는 **Python/FastAPI 독립 서비스** (`backend/src/domains/dlp/`), 팀 전체 백엔드는 Node.js/Express (`backend/src/app.js`, 8080번 포트).
- DLP는 uvicorn으로 별도 실행 (기본 8000번 포트).
- **공유 DB(Neon Postgres)** 를 Node와 DLP가 같이 씀. 로컬 각자 DB에서 공유 DB로 전환 완료.

### 로컬 실행 방법
```
cd backend/src/domains/dlp
venv\Scripts\Activate.ps1
pip install -r requirements.txt   # fastembed 등 새로 추가된 게 있으면 재설치 필요
uvicorn main:app --reload         # localhost:8000
```
Node 쪽은 `cd backend && npm install && npm run dev` (8080번 포트).
DB는 Neon 공유 DB라 Docker 로컬 DB는 더 이상 안 씀. `backend/.env`, `backend/src/domains/dlp/.env`에 연결 정보 필요 (팀 채널 참고).

## 2. 구현된 것 — DLP 백엔드 (`backend/src/domains/dlp/`)

- `db.py` — SQLAlchemy 연결. `.env`의 `DATABASE_URL` 또는 `DB_*`를 읽고, 없으면 로컬 기본값 사용. Neon 유휴 연결 끊김 대응 `pool_pre_ping` 적용.
- `models.py`:
  - `UsageLog` — `user_id`, `description`(원문), `masked_description`(마스킹본, 목록 기본 노출용)
  - `EventLog` — `detection_type`, `masked_yn`, `grade`, `similarity_score`(Embedding Similarity 근거 점수, 감사용)
  - `ActionHistory` — 조치 이력
  - `User`, `Department` — Node의 `users`/`department` 테이블을 읽기 전용으로 매핑 (같은 DB 공유라 API 연동 없이 join 가능)
- `detector.py`:
  - PII 정규식: 주민번호, 휴대폰번호, 계좌번호, 카드번호, 이메일
  - 프롬프트 인젝션·탈옥 탐지 (정규식, 한/영 패턴)
  - 겹치는 탐지 중 더 구체적인(긴) 매칭만 채택하는 중복 제거 로직
  - `BLOCK_TYPES`(마스킹 대신 차단): 주민번호, 프롬프트 인젝션, confidential_similarity
- `embedding_detector.py` — **Embedding Similarity 탐지** (신규):
  - `fastembed` + `intfloat/multilingual-e5-large` 모델로 **로컬에서만** 임베딩 계산 (외부 전송 없음)
  - 카테고리: 기밀문서, 고객금융정보, 인사정보, 미공개 회사정보
  - 정규식으로 못 잡는 "같은 의미, 다른 표현"을 탐지
- `main.py` — FastAPI 엔드포인트:
  - `GET /health`
  - `POST /gateway/chat` — 프롬프트 검사(PII + 인젝션 + 임베딩 유사도) → 마스킹/차단/허용 판단 → `usage_log`/`event_log`/`action_history` 자동 기록
  - `GET /events` — 위험 이벤트 목록 (N+1 쿼리 최적화 완료, ljy 담당자 작업)
  - `POST /events/{event_id}/action` — 컴플라이언스 담당자 수동 조치

## 3. 구현된 것 — 프론트 (`frontend/src/pages/compliance/risk-events/`)

- **`ComplianceRiskEventsPage.jsx`** — "위험 이벤트 관리" 화면 (원래 `eoa` 담당자가 만든 UI에 우리 DLP 백엔드를 연동함, 우리가 따로 만들었던 `EventListPage`는 중복이라 삭제하고 이걸로 통일)
  - 실제 DLP 데이터 조회/표시, 사용자·부서 실데이터
  - 필터: 위험등급, 조치상태, **부서, 기간(신규)**
  - **반품 위반자 표시(신규)**: 같은 사용자가 이번 달 몇 번째 이벤트인지 배지로 표시
  - 상세 모달: 조치하기(확인/상급보고/오탐), **유사도 점수(신규)**, **원문/마스킹 토글(신규)**
- `api/dlpApi.js` — `getEvents()`, `postEventAction()` (baseURL: `/dlp-api`, vite proxy로 8000번 포트 연결)

## 4. AI 채팅 ↔ DLP 연동 (`backend/src/domains/chat/chat.service.js`)

- AI 채팅(`/ai-chat`) 메시지가 실제로 DLP `/gateway/chat`을 거쳐서 탐지됨
- **사용자 입력**뿐 아니라 **AI가 생성한 응답**도 한 번 더 DLP로 검사 (참조 데이터 유출/환각 대비)
- 마스킹된 경우 마스킹본만 저장/AI 제공자(Solar)에 전달, 원문이 외부로 안 나감
- DLP 서비스가 안 떠 있으면 탐지 없이 통과시키고 에러만 로그 (채팅 자체가 막히지 않도록)

## 5. 공유 DB(Neon) 전환 및 스키마 정리

- 로컬 각자 Postgres → Neon 공유 DB로 전환
- Node(`sequelize`)와 DLP(`SQLAlchemy`) 둘 다 `DB_SSL=true`로 연결
- **`sequelize.sync({ alter: true })` 제거** — 서버 켤 때마다 자동으로 스키마가 바뀌는 게 공유 DB에서 위험해서 (실제로 unique 제약 50개 넘게 중복 생성되는 사고 있었음)
- 마이그레이션(`sequelize-cli`)으로 스키마 관리 전환, `backend/DB_GUIDE.md`에 전체 구조 설명 문서화
- 스키마 변경 시 이제 `npx sequelize-cli migration:generate` → `db:migrate`로만 반영

## 6. 알려진 이슈 / 트러블슈팅

- **로컬 8000번 포트가 가끔 좀비 프로세스로 막힘** (`WinError 10013`/`10048`) — 재부팅하거나 실제 소유 프로세스를 찾아서 강제 종료 필요
- **main pull 후 `npm install` 필요** — 팀원이 새 패키지(`multer` 등) 추가했는데 로컬에 반영 안 하면 백엔드가 크래시하고 프론트에서 502로 보임
- **Embedding Similarity 관련**: 아주 짧은 텍스트(전화번호만 있는 답변 등)는 임베딩 유사도가 불안정하게 나올 수 있음 (알려진 한계, 임계값/레퍼런스 튜닝 필요)
- **`confidential_similarity`가 같이 걸린 이벤트는 마스킹본이 전체 별표로만 나옴** (문장 전체를 하나의 구간으로 판단하는 방식이라 그럼 — 안전하지만 목록에서 구분이 잘 안 됨)

## 7. 팀 전체 상황 (참고)

- main에 여러 팀원이 계속 병합 중 (auth, policy, admin, notices, ai-tools, regulation 등 도메인 활발히 개발 중)
- main 병합 중 팀원 실수로 인한 회귀가 몇 차례 있었음 (라우트/사이드바 메뉴 삭제, DLP 탐지 코드 되돌림) → 발견 시 우리 최신 버전으로 복구
- 코드만 있고 실제 만든 사람이 불명확한 테이블 5개(`chat_sessions`, `chat_messages`, `login_histories`, `ai_tool_applications`, `notices`)가 있었는데, 이후 팀원들이 실제 코드를 올려서 대부분 정리됨
- 규제매핑(`regulation` 도메인, `/regulations` 페이지)은 다른 팀원이 진행 중 — 나중에 DLP의 탐지 이벤트와 규제조항을 연결하는 기능으로 이어질 가능성 있음

## 8. 다음에 할 수 있는 것

- **버그 수정**: 계좌번호 정규식이 날짜 형식(`2026-07-29`)을 오탐하는 문제 (아직 미수정)
- Embedding Similarity 레퍼런스 문장 확충, 임계값 튜닝
- PII 패턴 추가 (여권번호, 운전면허번호, IP 주소, API 키/시크릿 등)
- FastAPI 비동기 처리 (`/gateway/chat`이 동기라 임베딩 계산 중 다른 요청이 막힘)
- 위험 이벤트 관리 화면: 규제조항 매핑 표시, CSV 내보내기, 미조치 경과일(SLA) 표시, 담당자 배정, 일괄 처리
- 코드 없이 있던 5개 테이블 담당자 확인 (진행 상황 재확인 필요)
- DLP 스펙 대비 미구현 항목(API Gateway, OpenTelemetry+Elasticsearch, Vault/KMS, Keycloak)이 실제 요구사항인지 팀/과제 요건 확인
