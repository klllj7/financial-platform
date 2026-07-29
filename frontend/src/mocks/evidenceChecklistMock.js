/*
  백엔드 API 연결 전 상시평가 증빙자료 화면을 테스트하기 위해
  임시로 사용하는 Mock 데이터다.

  백엔드가 완성되면 이 파일의 데이터 대신
  API 응답 데이터를 사용하게 된다. (src/api/reportApi.js 참고)

  result/evidence/file은 "생성"/"업로드" 전 기본 상태를 나타내기 위해
  전부 미이행 · 미준비 · null로 시작한다. (backend/src/domains/report/evidence/checklistItems.js와
  동일한 generationMode/preparedMaterial 값을 사용한다.)
*/

export const CATEGORY_META = [
  { key: "관리적", label: "⑦ 관리적 보호조치", tier: "핵심" },
  { key: "기술적", label: "⑧ 기술적 보호조치", tier: "핵심" },
  { key: "처리위탁", label: "⑥ 처리위탁", tier: "핵심" },
  { key: "수집", label: "② 수집", tier: "부분" },
  { key: "제공", label: "③ 제공", tier: "부분" }
];
export const NA_CATEGORIES = ["① 동의원칙", "④ 보유·삭제", "⑤ 권리보장", "⑨ 가명정보 보호조치"];

export const ITEMS = [
    { no: "1", title: "AI특화 위협모델링 기법 활용, 정기 식별절차 마련", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "자산 기반 위협 시나리오 매핑 초안" },
    { no: "2", title: "식별된 위협 분류·분석, 위험수준별 대응전략", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "탐지 이벤트 유형별 분류표 + 대응전략 초안" },
    { no: "3", title: "위협 발생가능성·영향도 평가, 우선순위·대응방안", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "탐지 이벤트 빈도·심각도 기반 우선순위 스코어표" },
    { no: "4", title: "기획단계부터 보안성 확보·검증방안 수립", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: "준비 자료 없음 — 서비스 범위 밖" },
    { no: "10", title: "고영향·고위험AI 적대적공격 모의훈련 정기수행", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },
    { no: "13", title: "반복질의 통한 내부정보유출공격 모의훈련", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },
    { no: "14", title: "데이터·모델 목록관리, 접근권한·변경삭제 기록", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "AI 자산 인벤토리 + 접근/변경 이력" },
    { no: "25", title: "오작동시 긴급정지기능(Kill Switch) 구축", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "킬스위치 설정문서 + 발동 이력" },
    { no: "28", title: "기존교육 외 AI특화 보안위협 교육 실시", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },
    { no: "29", title: "운영이관전·운영중 정기 보안성검증 수행", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "정기점검 이력 로그" },
    { no: "30", title: "고영향·고위험AI 제3자검증기관 독립검증", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },
    { no: "31", title: "취약점 즉시보완·재검증·결과문서화", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "취약점 발견~조치 이력 로그" },
    { no: "32", title: "신규위협·환경변화·모델업데이트 대응 지속관리", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "위협 인텔리전스 반영 이력 + 정책 변경 로그" },
    { no: "33", title: "정기 보안점검일정 수립·점검", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "점검 캘린더 + 점검결과 로그" },
    { no: "34", title: "모델·데이터 업데이트시 보안성 영향 사전평가", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "업데이트 이력 로그 + 영향평가 초안" },
    { no: "35", title: "보안사고 발생시 원인분석·재발방지 방안 수립", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "사고대응 이력 로그 (미발생시 자동 해당없음)" },
    { no: "37", title: "오픈소스AI도구 라이선스·취약점·업데이트 관리", category: "관리적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "SBOM 기반 라이선스·버전 목록" },

    { no: "5", title: "외부입력·외부데이터 정상범위 이탈 사전검토 기능", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "입력검증 룰셋 설정값 + 차단 이벤트 로그" },
    { no: "6", title: "대화형AI 시스템제약 우회시도 탐지·차단 필터링", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "프롬프트 인젝션/탈옥 탐지 로그" },
    { no: "7", title: "입출력 목적외 고유식별정보·개인신용정보 탐지·마스킹", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "PII 탐지·마스킹 이벤트 로그" },
    { no: "8", title: "출력·에러메시지 내 AI모델정보 노출방지", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "출력필터링 설정 캡처 + 에러메시지 정제 정책" },
    { no: "9", title: "적대적예제/프롬프트인젝션·탈옥 방어체계 구축", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "방어 아키텍처 설명서 + 탐지모델 버전정보" },
    { no: "11", title: "보안위협 실시간 감지·대응체계 구축", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "모니터링 대시보드 스냅샷 + 알림·대응 이력" },
    { no: "12", title: "사용자별 질의횟수 제한, 접근빈도 모니터링", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "Rate limit 설정값 + 초과탐지 로그" },
    { no: "17", title: "오픈모델 다운로드전 파일무결성·보안취약점 확인", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "조건부", preparedMaterial: "자체 호스팅 모델 있으면 해시검증 로그, 없으면 해당없음" },
    { no: "23", title: "모델·학습데이터에 소스코드 동일수준 접근통제", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "모델·데이터 접근권한 설정 캡처 + 접근로그" },
    { no: "24", title: "자동화된 접근패턴 모니터링, 최소권한 부여", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "권한부여 이력 + 이상접근 탐지 로그" },
    { no: "36", title: "상용생성형AI 내부망이용시 연계보안대책 이행", category: "기술적", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "연계구간 암호화 설정 캡처 + 접속 로그" },

    { no: "15", title: "외부제공 AI모델/오픈모델 악의적조작 여부 사전검증", category: "처리위탁", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },
    { no: "16", title: "모델 출처·개발이력 확인, 신뢰가능 제공자만 도입", category: "처리위탁", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "연동 LLM 벤더/모델 버전 목록" },
    { no: "20", title: "AI생태계 특수구조·의존성 고려한 공급망보안 관리", category: "처리위탁", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "사용 중 AI벤더·라이브러리 목록" },
    { no: "21", title: "AI모델·API·프레임워크 사전검증, 학습데이터출처 확인", category: "처리위탁", result: "미이행", evidence: "미준비", file: null, generationMode: "반자동", preparedMaterial: "연동 API 목록 + 보안점검 결과표" },
    { no: "22", title: "외부AI서비스 업체 계약시 보안대응능력·거버넌스 평가", category: "처리위탁", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },
    { no: "27", title: "모델개선목적 데이터재사용 금지 확인·계약명시", category: "처리위탁", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },
    { no: "38", title: "클라우드 AI서비스 보안책임분담·데이터처리지역 통제", category: "처리위탁", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null },

    { no: "18", title: "외부제공 데이터 의도적조작·오염 여부 검증절차", category: "수집", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "RAG 참조데이터 해시비교·변경이력" },
    { no: "19", title: "실시간·주기적 외부데이터수집시 오염공격 위협평가", category: "수집", result: "미이행", evidence: "미준비", file: null, generationMode: "자동", preparedMaterial: "데이터 소스별 이상치 탐지 로그" },

    { no: "26", title: "클라우드·상용생성형AI 이용시 데이터 국외이전 확인", category: "제공", result: "미이행", evidence: "미준비", file: null, generationMode: "수동", preparedMaterial: null }
];
