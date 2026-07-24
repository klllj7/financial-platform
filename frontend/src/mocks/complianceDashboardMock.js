/*
  컴플라이언스 전사 대시보드에서 사용할 임시 데이터다.

  현재는 백엔드 API가 연결되지 않았기 때문에
  화면 구현과 기능 확인을 위해 Mock 데이터를 사용한다.

  나중에 백엔드 API가 연결되면
  이 데이터를 API 응답값으로 교체하면 된다.
*/


/* ==================================================
   전사 대시보드 상단 요약 데이터
================================================== */

export const complianceDashboardSummary = {
  /*
    오늘 처리해야 하지만
    아직 조치하지 않은 위험 이벤트 건수
  */
  actionRequiredCount: 3,

  /*
    대시보드 데이터 기준일
  */
  기준Date: "2026-07-23",

  /*
    이번 달 전사 AI 사용 횟수
  */
  totalUsageCount: 1284,

  /*
    전월과 비교한 AI 사용량 증가율
  */
  usageChangeRate: 12,

  /*
    위험 등급별 이벤트 발생 건수
  */
  riskCount: {
    high: 38,
    medium: 42,
    low: 20,
  },

  /*
    HIGH 등급 중 즉시 조치가 필요한 건수
  */
  urgentActionCount: 5,

  /*
    이번 달 전사 토큰 사용량
  */
  tokenUsage: "4.2M",

  /*
    이번 달 예상 AI 사용 비용
  */
  estimatedCost: 1284000,

  /*
    이번 달 AI 사용 예산
  */
  monthlyBudget: 1900000,

  /*
    전체 예산 중 현재 사용한 비율
  */
  budgetUsageRate: 68,
};


/* ==================================================
   최근 공지사항
================================================== */

export const complianceNoticeData = [
  {
    id: 1,
    category: "시스템",
    title: "생성형 AI 사용 정책 개정 안내",
    date: "2026-07-23",
  },
  {
    id: 2,
    category: "정책",
    title: "여신심사부 ChatGPT 사용 제한 강화",
    date: "2026-07-22",
  },
  {
    id: 3,
    category: "정책",
    title: "준법감시부 AI 보조 범위 안내",
    date: "2026-07-20",
  },
];


/* ==================================================
   위험 이벤트 도넛 그래프 데이터
================================================== */

export const complianceRiskChartData = [
  {
    name: "HIGH",
    value: 38,
    color: "#ff4d4f",
  },
  {
    name: "MEDIUM",
    value: 42,
    color: "#f59e0b",
  },
  {
    name: "LOW",
    value: 20,
    color: "#10b981",
  },
];


/* ==================================================
   부서별 위험 이벤트 데이터
================================================== */

export const departmentRiskData = [
  {
    department: "여신심사부",
    high: 2,
    medium: 3,
    low: 4,
  },
  {
    department: "리스크관리부",
    high: 1,
    medium: 2,
    low: 3,
  },
  {
    department: "IT운영팀",
    high: 1,
    medium: 1,
    low: 2,
  },
  {
    department: "경영기획부",
    high: 0,
    medium: 1,
    low: 3,
  },
  {
    department: "준법감시부",
    high: 0,
    medium: 1,
    low: 1,
  },
  {
    department: "고객서비스부",
    high: 0,
    medium: 1,
    low: 2,
  },
  {
    department: "인사부",
    high: 0,
    medium: 0,
    low: 1,
  },
  {
    department: "재무부",
    high: 0,
    medium: 0,
    low: 0,
  },
];


/* ==================================================
   30일 사용 추이 데이터
================================================== */

export const complianceUsageTrendData = [
  {
    date: "6/13",
    usageCount: 36,
    riskEventCount: 8,
  },
  {
    date: "6/16",
    usageCount: 45,
    riskEventCount: 11,
  },
  {
    date: "6/19",
    usageCount: 47,
    riskEventCount: 10,
  },
  {
    date: "6/22",
    usageCount: 34,
    riskEventCount: 7,
  },
  {
    date: "6/25",
    usageCount: 21,
    riskEventCount: 4,
  },
  {
    date: "6/28",
    usageCount: 28,
    riskEventCount: 6,
  },
  {
    date: "7/1",
    usageCount: 43,
    riskEventCount: 9,
  },
  {
    date: "7/4",
    usageCount: 48,
    riskEventCount: 11,
  },
  {
    date: "7/7",
    usageCount: 35,
    riskEventCount: 8,
  },
  {
    date: "7/10",
    usageCount: 22,
    riskEventCount: 5,
  },
  {
    date: "7/12",
    usageCount: 24,
    riskEventCount: 4,
  },
];

/* ==================================================
   오늘의 조치 필요 항목

   아직 조치가 완료되지 않은 위험 이벤트 목록이다.
   백엔드 연결 후에는 위험 이벤트 조회 API 응답값으로
   교체하면 된다.
================================================== */

export const complianceActionItems = [
  {
    id: 1,

    // 위험 등급
    riskLevel: "HIGH",

    // 사용자 이름은 개인정보 노출을 줄이기 위해 마스킹한다.
    userName: "조*정",

    department: "여신심사부",

    // 어떤 위험이 탐지되었는지 표시한다.
    eventType: "고객정보 포함 질의",

    // 사용한 AI 모델
    modelName: "GPT-4o",

    // 현재 조치 상태
    actionStatus: "조치없음",

    // CSS 색상 구분에 사용할 값
    actionStatusType: "none",

    occurredAt: "방금 전",
  },
  {
    id: 2,
    riskLevel: "HIGH",
    userName: "강*철",
    department: "경영기획부",
    eventType: "비공개 재무데이터 입력",
    modelName: "Claude Sonnet",
    actionStatus: "조치없음",
    actionStatusType: "none",
    occurredAt: "5시간 전",
  },
  {
    id: 3,
    riskLevel: "MEDIUM",
    userName: "박*진",
    department: "리스크관리부",
    eventType: "내부망 우회 시도",
    modelName: "GPT-4o-mini",
    actionStatus: "모니터링",
    actionStatusType: "monitoring",
    occurredAt: "23시간 전",
  },
];

/* 위험 이벤트 관리 전체 목록 */
export const complianceRiskEvents = [
  { id: 1, riskLevel: "HIGH", userName: "조*정", department: "여신심사부", eventType: "고객정보 포함 질의", modelName: "GPT-4o", promptSummary: "고객 상담 내역과 계좌정보를 포함한 요약 요청", actionStatus: "미조치", actionStatusType: "none", occurredAt: "2026-07-24 10:42" },
  { id: 2, riskLevel: "HIGH", userName: "강*철", department: "경영기획부", eventType: "비공개 재무데이터 입력", modelName: "Claude Sonnet", promptSummary: "공시 전 분기 실적 자료 분석 요청", actionStatus: "미조치", actionStatusType: "none", occurredAt: "2026-07-24 05:18" },
  { id: 3, riskLevel: "MEDIUM", userName: "박*진", department: "리스크관리부", eventType: "내부망 우회 시도", modelName: "GPT-4o-mini", promptSummary: "승인되지 않은 외부 AI 접속 시도", actionStatus: "모니터링", actionStatusType: "monitoring", occurredAt: "2026-07-23 11:03" },
  { id: 4, riskLevel: "HIGH", userName: "한*수", department: "고객서비스부", eventType: "개인식별정보 입력", modelName: "Microsoft Copilot", promptSummary: "주민등록번호가 포함된 민원 내용 정리 요청", actionStatus: "조치 중", actionStatusType: "processing", occurredAt: "2026-07-22 16:35" },
  { id: 5, riskLevel: "MEDIUM", userName: "김*현", department: "디지털전략부", eventType: "미승인 모델 사용", modelName: "Gemini 2.5 Pro", promptSummary: "사내 승인 목록에 없는 모델 호출", actionStatus: "조치 완료", actionStatusType: "completed", occurredAt: "2026-07-22 14:12" },
  { id: 6, riskLevel: "LOW", userName: "이*은", department: "준법감시부", eventType: "정책 키워드 탐지", modelName: "GPT-4.1", promptSummary: "내부 규정 초안의 표현 적정성 검토 요청", actionStatus: "조치 완료", actionStatusType: "completed", occurredAt: "2026-07-21 09:48" },
  { id: 7, riskLevel: "MEDIUM", userName: "정*우", department: "IT운영팀", eventType: "소스코드 외부 전송", modelName: "Claude Sonnet", promptSummary: "내부 인증 모듈 코드가 포함된 디버깅 요청", actionStatus: "모니터링", actionStatusType: "monitoring", occurredAt: "2026-07-20 18:27" },
  { id: 8, riskLevel: "LOW", userName: "오*민", department: "인사부", eventType: "민감정보 유사 패턴", modelName: "GPT-4o-mini", promptSummary: "채용 통계 내 전화번호 유사 패턴 탐지", actionStatus: "조치 완료", actionStatusType: "completed", occurredAt: "2026-07-19 13:05" },
];


/* ==================================================
   AI Tool · 모델 신청 현황

   컴플라이언스 검토가 필요한 최근 신청 목록이다.
   백엔드 연결 후에는 신청 현황 조회 API 응답값으로
   교체하면 된다.
================================================== */

export const complianceModelApplications = [
  {
    id: 1,
    applicantName: "김*현",
    department: "디지털전략부",
    requestName: "Microsoft Copilot",
    requestType: "AI Tool",
    status: "검토 대기",
    statusType: "pending",
    requestedAt: "오늘 09:24",
  },
  {
    id: 2,
    applicantName: "이*은",
    department: "고객서비스부",
    requestName: "GPT-4.1",
    requestType: "AI 모델",
    status: "검토 중",
    statusType: "reviewing",
    requestedAt: "어제 16:10",
  },
  {
    id: 3,
    applicantName: "정*우",
    department: "리스크관리부",
    requestName: "Claude Sonnet 4",
    requestType: "AI 모델",
    status: "승인",
    statusType: "approved",
    requestedAt: "07-22",
  },
  {
    id: 4,
    applicantName: "박*진",
    department: "여신심사부",
    requestName: "Gemini 2.5 Pro",
    requestType: "AI 모델",
    status: "반려",
    statusType: "rejected",
    requestedAt: "07-21",
    purpose: "여신심사 문서의 주요 위험 항목 요약",
    reviewer: "김준",
  },
  {
    id: 5,
    applicantName: "최*영",
    department: "IT운영팀",
    requestName: "GitHub Copilot",
    requestType: "AI Tool",
    status: "검토 중",
    statusType: "reviewing",
    requestedAt: "07-20",
    purpose: "사내 개발 생산성 개선 및 코드 리뷰 보조",
    reviewer: "이서현",
  },
  {
    id: 6,
    applicantName: "오*민",
    department: "인사부",
    requestName: "Microsoft 365 Copilot",
    requestType: "AI Tool",
    status: "승인",
    statusType: "approved",
    requestedAt: "07-18",
    purpose: "인사 보고서 및 회의록 초안 작성",
    reviewer: "김준",
  },
];
