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