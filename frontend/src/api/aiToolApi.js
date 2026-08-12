import axiosInstance from "./axiosInstance";

/* 로그인 사용자의 역할에 맞는 AI Tool 신청 목록을 조회한다. */
export const getAiToolApplications = async () => {
  const response = await axiosInstance.get("/ai-tool");
  return response.data;
};

/* 모든 역할이 공통으로 사용할 수 있는 승인·활성 AI Tool 목록을 조회한다. */
export const getAvailableAiTools = async () => {
  const response = await axiosInstance.get("/ai-tool/available");
  return response.data;
};

/* 신청 가능한 Bedrock 서버리스 모델 카탈로그를 조회한다. */
export const getBedrockModelCatalog = async () => {
  const response = await axiosInstance.get("/ai-tool/bedrock-models");
  return response.data;
};

/* 로그인한 모든 역할이 전체 AI Tool 신청 목록을 조회한다. */
export const getAllAiToolApplications = async () => {
  const response = await axiosInstance.get("/ai-tool/all");
  return response.data;
};

/* 임직원이 새로운 AI Tool 사용을 신청한다. */
export const createAiToolApplication = async (payload) => {
  const response = await axiosInstance.post("/ai-tool", payload);
  return response.data;
};

/* 관리자가 승인·활성 상태의 AI 모델을 직접 추가한다. */
export const createManagedAiTool = async (payload) => {
  const response = await axiosInstance.post("/ai-tool/managed", payload);
  return response.data;
};

/* 관리자가 신청을 승인·반려한다. */
export const reviewAiToolApplication = async (
  applicationId,
  payload,
) => {
  const response = await axiosInstance.patch(
    `/ai-tool/${applicationId}/review`,
    payload,
  );
  return response.data;
};

/* 관리자가 승인된 AI Tool의 활성 여부를 변경한다. */
export const updateAiToolActiveStatus = async (
  applicationId,
  isActive,
) => {
  const response = await axiosInstance.patch(
    `/ai-tool/${applicationId}/active`,
    { isActive },
  );
  return response.data;
};

/* 관리자가 AI Tool 신청 또는 직접 등록 모델을 삭제한다. */
export const deleteAiToolApplication = async (applicationId) => {
  const response = await axiosInstance.delete(`/ai-tool/${applicationId}`);
  return response.data;
};
