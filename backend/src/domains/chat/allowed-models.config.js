/*
  시연 영상용으로 확실히 동작하는 모델만 허용하는 화이트리스트다.
  bedrock-adapters.js의 SUPPORTED_VENDORS(벤더 단위)보다 더 좁은,
  "정확히 이 모델 ID만" 단위의 필터라서 별도 파일로 분리했다.

  ▼▼▼ ID를 바꿔야 할 때는 이 배열만 수정하면 된다 ▼▼▼
*/
const ALLOWED_MODELS = [
  {
    modelId: "global.anthropic.claude-haiku-4-5-20251001-v1:0",
    displayName: "Claude Haiku 4.5",
  },
  {
    // 이미 호출 테스트를 마친 모델(APAC 크로스 리전 추론 프로파일)로 교체함.
    modelId: "apac.anthropic.claude-3-5-sonnet-20240620-v1:0",
    displayName: "Claude 3.5 Sonnet",
  },
];

const isAllowedModel = (modelId) =>
  ALLOWED_MODELS.some((entry) => entry.modelId === modelId);

/* 화이트리스트에 있으면 사람이 읽기 좋은 이름을, 없으면 null을 반환한다. */
const getDisplayName = (modelId) =>
  ALLOWED_MODELS.find((entry) => entry.modelId === modelId)?.displayName || null;

module.exports = { ALLOWED_MODELS, isAllowedModel, getDisplayName };
