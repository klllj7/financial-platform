import axiosInstance from "./axiosInstance";

// 백엔드 서버 상태 확인 API
export const getHealthCheck = async () => {
  const response = await axiosInstance.get("/health");
  return response.data;
};