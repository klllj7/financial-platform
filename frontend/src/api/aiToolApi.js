import axiosInstance from "./axiosInstance";

/* 로그인 사용자의 역할에 맞는 AI Tool 신청 목록을 조회한다. */
export const getAiToolApplications = async () => {
  const response = await axiosInstance.get("/ai-tool");
  return response.data;
};

/* 임직원이 새로운 AI Tool 사용을 신청한다. */
export const createAiToolApplication = async (payload) => {
  const response = await axiosInstance.post("/ai-tool", payload);
  return response.data;
};

/* 컴플라이언스 담당자 또는 관리자가 신청을 승인·반려한다. */
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
