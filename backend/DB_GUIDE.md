# DB 구조 가이드

> 루트의 [README.md](../README.md)에 있는 ERD는 초기 설계안이고, 실제로 구현된 것과 차이가 있습니다.
> 팀 논의 결과 지금은 실제 구현을 기준으로 진행하고, 구조가 최종적으로 안정되면 그때 ERD를 다시 그리기로 했습니다.
> 이 문서는 **지금 실제로 어떻게 동작하는지**를 설명합니다.

## 큰 그림

이 프로젝트는 하나의 공유 Postgres DB(Neon)를 **두 개의 서로 다른 시스템**이 나눠서 씁니다.

- **Node/Sequelize** — auth, policy, admin, notices, ai-routing 등 대부분의 도메인
- **Python/SQLAlchemy** — DLP(위험 탐지) 도메인 (`backend/src/domains/dlp/`)

두 시스템은 완전히 독립적으로 동작하고, 서로의 존재를 모릅니다. 같은 DB의 서로 다른 테이블을 각자 관리할 뿐입니다.

## 스키마는 이제 마이그레이션으로만 관리합니다

**예전에는** `sequelize.sync({ alter: true })`가 서버 켤 때마다 자동으로 테이블을 만들고 고쳤습니다. 로컬 각자 DB일 땐 문제없었지만, 공유 DB로 옮긴 뒤로는 누군가 서버만 켜도 전원의 스키마가 바뀌는 위험한 구조였고, 실제로 `department.code`/`roles.code`/`users.email`에 중복 unique 제약이 50개 넘게 쌓이는 사고가 있었습니다. 그래서 **제거했습니다** ([app.js](src/app.js), [db/init.js](src/db/init.js)).

**지금부터는** 스키마 변경을 `sequelize-cli` 마이그레이션 파일로만 반영합니다.

```bash
# 스키마 바꿀 때
npx sequelize-cli migration:generate --name add-xxx-to-yyy
# migrations/생성된파일.js 의 up()/down() 직접 작성
npx sequelize-cli db:migrate
```

Node 쪽 스키마 변경은 이제 파일로 남고, 리뷰 가능하고, `db:migrate:undo`로 되돌릴 수 있습니다.

## 파일이 왜 이렇게 흩어져 있나

같은 역할을 하는 것 같은 파일이 여러 곳에 있어서 헷갈릴 수 있는데, 각자 역할이 다릅니다.

| 파일/폴더 | 역할 |
|---|---|
| `src/common/config/db.js` | **앱이 실제로 쓰는** Sequelize 연결 (런타임용) |
| `src/common/config/database.js` | `sequelize-cli`가 쓰는 연결 설정 (마이그레이션 실행용). `sequelize-cli` 관례상 앱 런타임 설정과 분리되어 있어서 파일이 두 개입니다 — `DB_SSL` 등 연결 옵션 바꿀 땐 **둘 다** 고쳐야 합니다. |
| `.sequelizerc` | `sequelize-cli`한테 `migrations`/`models`/`seeders`/`config` 폴더 위치를 알려주는 설정 |
| `src/db/migrations/` | **스키마의 실제 소스** — 여기 있는 파일들이 지금 DB 구조와 정확히 일치하도록 유지되어야 함 |
| `src/db/models/` | 비어있음. `sequelize-cli models:generate`로 만들 수 있는 폴더인데, 앱은 이걸 안 쓰고 아래 도메인별 모델 파일을 직접 씁니다. |
| `src/db/seeders/` | 비어있음. 실제 시드 로직은 `sequelize-cli` 방식이 아니라 `src/db/init.js`에 직접 있습니다. |
| `src/db/init.js` | 기본 권한/부서 데이터 생성 (`seedBasicData`). 서버 켤 때(`app.js`) 자동 실행되고, `npm run seed`로 단독 실행도 가능. |
| `src/domains/*/models/*.js`, `*.model.js` | **앱이 실제로 쿼리할 때 쓰는** Sequelize 모델 (User, Role, Department, PolicyInfo, PolicyHistory 등). `db/migrations`가 "테이블을 어떻게 만들지"라면, 이건 "앱이 그 테이블을 어떻게 쓸지"입니다. **이 둘은 서로 자동으로 안 맞춰집니다** — 모델 필드를 바꾸면 마이그레이션도 손으로 같이 바꿔야 합니다. |
| `src/domains/dlp/db.py` | DLP(Python)의 DB 연결 (`.env`의 `DATABASE_URL` 또는 `DB_*` 사용) |
| `src/domains/dlp/models.py` | DLP가 쓰는 SQLAlchemy 모델 (`UsageLog`, `EventLog`, `ActionHistory` + 읽기 전용 `User`/`Department`) |
| `src/domains/dlp/init_db.py` | DLP 테이블 생성 스크립트. **`sequelize-cli db:migrate`로는 안 만들어짐** — 따로 `python init_db.py` 실행해야 함 |

## 지금 존재하는 테이블 (2026-07-27 기준, 총 13개)

### Node가 관리 (마이그레이션 있음, `src/db/migrations/`)
`department`, `roles`, `users`, `policy_info`, `policy_history`, `chat_sessions`, `chat_messages`, `login_histories`, `ai_tool_applications`, `notices`

### DLP(Python)가 관리 (마이그레이션 없음, `init_db.py`로 생성)
`usage_log`, `event_log`, `action_history`

### ⚠️ 주의: 코드가 없는 테이블 5개
`chat_sessions`, `chat_messages`, `login_histories`, `ai_tool_applications`, `notices` — 이 5개는 현재 코드베이스 어디에도 해당 모델 파일이 없습니다. 누군가 로컬에서 커밋 안 한 코드로 서버를 켜서 이미 만들어놓은 것으로 추정됩니다. 마이그레이션 파일은 **현재 DB에 있는 모양을 그대로 리버스 엔지니어링**해서 만든 것이라, 실제 담당자의 의도와 다를 수 있습니다. 해당 기능 작업하시는 분은 확인 후 필요하면 마이그레이션을 추가해주세요.

## 새로 합류했거나 로컬 세팅할 때

1. `backend/.env` 만들기 (Neon 연결 정보는 팀 채널 참고)
2. `npm install`
3. `npm run dev` (스키마는 이미 마이그레이션으로 존재하므로 별도 작업 불필요, 기본 권한/부서 데이터만 자동 생성됨)
4. DLP 작업 시: `backend/src/domains/dlp/.env` 만들고 `pip install -r requirements.txt` 후 `python init_db.py` 한 번 실행
