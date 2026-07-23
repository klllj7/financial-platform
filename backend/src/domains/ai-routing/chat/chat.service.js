import { randomUUID } from "node:crypto";

const mockModels = [
  {
    aiToolId: 1,
    toolName: "기본 AI 모델",
    provider: "MOCK",
    description: "프론트엔드와 백엔드 연결 테스트용 모델",
  },
];

export function findAvailableModels() {
  return mockModels;
}

export async function processChat({
  message,
  sessionId,
  aiToolId,
  promptStorageId,
}) {
  const requestId = randomUUID();
  const currentSessionId = sessionId || randomUUID();

  /*
   * 이후 실제 구현 순서
   *
   * 1. JWT에서 사용자 정보 확인
   * 2. C 담당 DLP 요청 검사
   * 3. 허용 가능한 AI 모델 확인
   * 4. 실제 AI API 호출
   * 5. C 담당 DLP 응답 검사
   * 6. UsageLog 저장
   * 7. 사용자에게 응답 반환
   */

  return {
    requestId,
    sessionId: currentSessionId,
    reply: `[임시 AI 응답] 입력한 메시지: ${message}`,
    modelUsed: aiToolId ? `AI_TOOL_${aiToolId}` : "MOCK_MODEL",
    riskLevel: "LOW",
    actionType: "ALLOW",
    tokenUsage: 0,
    costKrw: 0,
    promptStorageId: promptStorageId || null,
  };
}