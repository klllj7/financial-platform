# D 역할(규제 매핑·정책) 작업 정리

마지막 업데이트: 2026-07-27
담당: leeminju8919 (D 역할 — 규제 매핑·정책, 풀스택)

이 문서는 지금까지 진행한 작업을 새 세션/새 페이지에서 이어갈 수 있도록 정리한 요약입니다.

---

## 1. 인프라

- 백엔드: Node.js + Express + Sequelize
- DB: 처음엔 로컬 Docker PostgreSQL로 개발하다가, **팀 공유 Neon(서버리스 Postgres) DB로 전환**했습니다.
- `.env`(백엔드): `DB_HOST`는 Neon의 **direct 엔드포인트**를 씁니다 (`-pooler`가 안 붙은 주소). pooler(PgBouncer) 엔드포인트를 쓰면 컬럼이 있다가 없다가 하는 것처럼 보이는 이상 현상이 있었고, direct로 바꿔서 해결했습니다.
- **중요**: `backend/src/app.js`에는 더 이상 `sequelize.sync({ alter: true })`가 없습니다. 공유 DB에서 서버 켤 때마다 스키마가 자동으로 바뀌는 게 위험하다고 판단해서 제거했고, **이제 스키마 변경은 전부 sequelize-cli 마이그레이션 파일로 관리**합니다.
  - 마이그레이션 위치: `backend/src/db/migrations/`
  - 실행 명령어 (backend 폴더에서): `npx sequelize-cli db:migrate`
  - 새 테이블/컬럼이 필요하면 **모델 파일을 고치는 것과 별개로, 마이그레이션 파일도 새로 만들어서 실행해야** 실제 DB에 반영됩니다.

---

## 2. 정책(Policy) 도메인 — 완성

### 백엔드 (`backend/src/domains/policy/`)

- **모델**
  - `models/policyInfo.js` — `department_id`, `name`, `rule_content`(텍스트), `version`, `active_yn`, `approval_status`(pending/approved/rejected), `reject_reason`, `requested_by`, `reject_detail`, `revision_request`, `rejected_by`, `rejected_at`
  - `models/policyHistory.js` — 정책 수정 시 이전 버전을 스냅샷으로 저장 (`policy_id`, `version`, `rule_snapshot`)
- **컨트롤러/라우터** (`controllers/policyController.js`, `routes/policyRoutes.js`)
  - `POST /api/policies` — 정책 생성(요청)
  - `GET /api/policies` — 목록 조회 (부서명까지 조인해서 `department_name`으로 같이 내려줌)
  - `PUT /api/policies/:id` — 규칙/활성여부 수정 (버전 +1, 이력 저장)
  - `PATCH /api/policies/:id/approve` — 승인
  - `PATCH /api/policies/:id/reject` — 반려 (`reject_reason`, `reject_detail`, `revision_request`, `rejected_by` 저장, `rejected_at` 자동 기록)
  - `PATCH /api/policies/:id/active` — 활성화 여부만 변경 (버전/이력 안 건드림)

### 프론트엔드

- **`frontend/src/pages/policy/PolicyManagementPage.jsx`** — 컴플라이언스 담당자용
  - 정책 목록(테이블), 승인상태/활성여부 필터, 페이지네이션
  - "+ 요청" 모달로 새 정책 요청 (규칙은 JSON이 아니라 **일반 텍스트**로 입력 — 첫 줄은 개요, 그 아래 줄들은 규칙 목록으로 나중에 파싱됨)
  - 상세 모달: 조회 전용 (승인/반려 버튼 없음 — 관리자 전용 기능이라 뺐음), 반려 사유는 읽기 전용으로 표시
  - "편집" 버튼을 눌러야 활성화 토글 스위치가 눌리고, **승인완료 상태인 정책만** 토글 가능, "저장"해야 실제 반영
  - 목록은 활성화(`active_yn: true`)된 정책이 위로 오도록 정렬됨

- **`frontend/src/pages/admin/AdminPolicyPage.jsx`** — 관리자 전용
  - 정책 승인/반려를 여기서만 처리
  - 목록: 정책명/요청자/부서/버전/요청일/상태/상세, **승인대기 → 승인완료 → 반려 순 정렬**(동일 상태면 요청일 최신순), 페이지네이션(페이지당 개수 선택 가능)
  - 상세 모달: 요청자/부서/요청일/상태 메타정보, 정책 개요(회색 박스), 정책 규칙(번호 목록), 반려된 경우 반려 내용 박스(처리자/일시/사유/상세내용 + 노란색 보완요청사항 박스)
  - "반려" 클릭 시 사유(필수)/상세내용/보완요청사항 입력 폼이 뜨고, 제출해야 실제 반려 처리됨

- **`frontend/src/api/policyApi.js`** — `getPolicies`, `createPolicy`, `approvePolicy`, `rejectPolicy(id, {reject_reason, reject_detail, revision_request, rejected_by})`, `updatePolicy`, `setPolicyActive`

---

## 3. 규제 매핑(Regulation) 도메인 — 모델만 완성, API/화면은 아직

### 완성된 것

- 폴더: `backend/src/domains/regulation/`
- **모델 3개**
  - `models/regulationDocument.js` — 법령/가이드라인 문서 (`doc_name`, `revised_at`)
  - `models/regulationClause.js` — 문서 안의 개별 조항 (`doc_id`, `clause_no`, `title`, `description`)
  - `models/policyClauseMap.js` — 정책 ↔ 조항 다대다 매핑 (`policy_id`, `clause_id`)
- **마이그레이션**: `backend/src/db/migrations/20260727120000-create-regulation-tables.js` — 실행 완료, DB에 `regulation_document`, `regulation_clause`, `policy_clause_map` 테이블 생성 확인함
- `backend/src/app.js`에 3개 모델 `require`로 등록해둠

### 아직 안 한 것 (다음에 이어서 할 일)

1. **컨트롤러/라우터** — `backend/src/domains/regulation/controllers/`, `routes/`
   - 문서 목록 조회 (`GET /api/regulations/documents`)
   - 특정 문서의 조항 목록 조회 (`GET /api/regulations/documents/:id/clauses`)
   - 정책-조항 매핑 생성/삭제 (`POST`/`DELETE /api/regulations/clauses/:id/mappings`)
   - (참고: `frontend/scr/main.py`에 예전에 만든 FastAPI 목업 서버가 있는데, 이 API 스펙을 그대로 참고하면 됨 — 지금은 안 쓰지만 구조 참고용)
2. **시드 데이터** — 신용정보법 등 법령 문서/조항 샘플 데이터 넣기 (그래야 화면에서 테스트 가능)
3. **프론트엔드 화면** — 규제 매핑 페이지 (문서 선택 → 조항 목록 → 정책 연결/해제)
4. `app.js`에 새 라우터 연결

---

## 4. 알아두면 좋은 것들

- **팀 공유 DB라서, 스키마를 바꿀 땐 마이그레이션 파일로 하고 팀에 알려야 함.** (`sync` 자동 적용 방식은 팀에서 이미 제거함)
- 컴플라이언스 페이지와 관리자 페이지는 역할별로 기능이 분리되어 있음 (승인/반려는 관리자만, 활성화 토글은 컴플라이언스만 — 단 승인완료 정책만)
- `rule_content`는 DB 컬럼 타입은 JSONB지만 실제로는 **일반 문자열**을 그대로 저장하는 방식으로 씀 (JSON 파싱 안 함)
