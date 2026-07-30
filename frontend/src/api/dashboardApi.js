import axiosInstance from "./axiosInstance";

export const getMyDashboardSummary = async (month) => {
  const response = await axiosInstance.get("/dashboard/me/summary", { params: { month } });
  return response.data;
};

export const getMyDashboardTrend = async (days = 7) => {
  const response = await axiosInstance.get("/dashboard/me/trend", { params: { days } });
  return response.data;
};

/* 컴플라이언스 담당자의 선택 월 전사 AI 사용 추이를 조회한다. */
export const getComplianceDashboardTrend = async (month) => {
  const response = await axiosInstance.get("/dashboard/compliance/trend", {
    params: { month },
  });
  return response.data;
};

/* 컴플라이언스 대시보드 상단의 전사 사용·토큰 요약을 조회한다. */
export const getComplianceDashboardSummary = async (month) => {
  const response = await axiosInstance.get("/dashboard/compliance/summary", {
    params: { month },
  });
  return response.data;
};

export const getMyDashboardModels = async (month) => {
  const response = await axiosInstance.get("/dashboard/me/models", { params: { month } });
  return response.data;
};

export const getMyDashboardRecent = async (limit = 5) => {
  const response = await axiosInstance.get("/dashboard/me/recent", { params: { limit } });
  return response.data;
};

export const getMyDashboardUsage = async (params) => {
  const response = await axiosInstance.get("/dashboard/me/usage", { params });
  return response.data;
};
