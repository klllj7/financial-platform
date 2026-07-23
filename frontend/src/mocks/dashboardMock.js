/*
  백엔드 API 연결 전 대시보드 화면을 테스트하기 위해
  임시로 사용하는 Mock 데이터다.

  백엔드가 완성되면 이 파일의 데이터 대신
  API 응답 데이터를 사용하게 된다.
*/

/* 대시보드 상단 요약 정보 */
export const dashboardSummary = {
  riskEventCount: 5,
  mediumOrHigherCount: 2,
  totalUsageCount: 30,
  usageIncrease: 8,
  tokenUsage: "128K",
  estimatedCost: "3,840",
};

/* 모델별 사용 비율 */
export const modelAllocationData = [
  {
    modelName: "GPT-4o-mini",
    percentage: 45,
  },
  {
    modelName: "Claude Sonnet",
    percentage: 30,
  },
  {
    modelName: "GPT-4o",
    percentage: 25,
  },
];

/* 최근 7일 AI 사용 횟수와 위험 이벤트 발생 건수 */
export const usageTrendData = [
  {
    date: "7/16",
    usageCount: 3,
    riskCount: 1,
  },
  {
    date: "7/17",
    usageCount: 5,
    riskCount: 2,
  },
  {
    date: "7/18",
    usageCount: 2,
    riskCount: 1,
  },
  {
    date: "7/19",
    usageCount: 4,
    riskCount: 2,
  },
  {
    date: "7/20",
    usageCount: 6,
    riskCount: 3,
  },
  {
    date: "7/21",
    usageCount: 3,
    riskCount: 1,
  },
  {
    date: "7/22",
    usageCount: 7,
    riskCount: 2,
  },
];

/* 최근 AI 사용 이력 */
export const recentUsageData = [
  {
    id: 1,
    occurredAt: "2026-07-22 11:30",
    toolName: "GPT-4o-mini",
    provider: "OpenAI",
    detectionType: "일반 질의",
    riskLevel: "LOW",
    actionStatus: "조치없음",
  },
  {
    id: 2,
    occurredAt: "2026-07-21 15:20",
    toolName: "Claude Sonnet",
    provider: "Anthropic",
    detectionType: "문서 분석",
    riskLevel: "LOW",
    actionStatus: "조치없음",
  },
  {
    id: 3,
    occurredAt: "2026-07-20 14:05",
    toolName: "GPT-4o-mini",
    provider: "OpenAI",
    detectionType: "내부문서 업로드",
    riskLevel: "MEDIUM",
    actionStatus: "경고 발송",
  },
  {
    id: 4,
    occurredAt: "2026-07-19 10:40",
    toolName: "Claude Sonnet",
    provider: "Anthropic",
    detectionType: "일반 질의",
    riskLevel: "LOW",
    actionStatus: "조치없음",
  },
  {
    id: 5,
    occurredAt: "2026-07-18 16:55",
    toolName: "GPT-4o-mini",
    provider: "OpenAI",
    detectionType: "반복 질의 패턴",
    riskLevel: "LOW",
    actionStatus: "모니터링",
  },
];

/* 대시보드 오른쪽에 표시할 공지사항 */
export const dashboardNoticeData = [
  {
    id: 1,
    category: "보안",
    title: "생성형 AI 사용 시 개인정보 입력 금지 안내",
    content:
      "생성형 AI 사용 시 고객 이름, 주민등록번호, 계좌번호 등 개인정보를 직접 입력하지 않도록 주의해주세요.",
    createdAt: "2026-07-22",
    isNew: true,
  },
  {
    id: 2,
    category: "정책",
    title: "금융상품 설명 작성 업무 정책이 변경되었습니다.",
    content:
      "금융상품 관련 문구 작성 시 담당자 검토 절차가 추가되었습니다.",
    createdAt: "2026-07-20",
    isNew: true,
  },
  {
    id: 3,
    category: "점검",
    title: "AI 서비스 정기 점검 일정 안내",
    content:
      "서비스 안정화를 위한 정기 점검이 예정되어 있습니다.",
    createdAt: "2026-07-18",
    isNew: false,
  },
  {
    id: 4,
    category: "일반",
    title: "ComplianceAI 사용자 가이드가 등록되었습니다.",
    content:
      "AI 사용 방법과 보안 정책을 확인할 수 있는 사용자 가이드가 등록되었습니다.",
    createdAt: "2026-07-15",
    isNew: false,
  },
];

/*
  마이 대시보드와 AI Tool 페이지에서 사용할
  AI Tool 신청 현황 임시 데이터
*/
export const aiToolApplicationData = [
  {
    id: 1,
    toolName: "ChatGPT Enterprise",
    provider: "OpenAI",
    purpose: "문서 초안 작성 및 회의록 요약",
    requestedAt: "2026-07-21",
    status: "승인 완료",
    statusKey: "approved",
  },
  {
    id: 2,
    toolName: "Claude Enterprise",
    provider: "Anthropic",
    purpose: "금융 규정 및 내부 문서 분석",
    requestedAt: "2026-07-20",
    status: "검토 중",
    statusKey: "pending",
  },
  {
    id: 3,
    toolName: "Microsoft Copilot",
    provider: "Microsoft",
    purpose: "업무 문서 작성 보조",
    requestedAt: "2026-07-18",
    status: "반려",
    statusKey: "rejected",
  },
];