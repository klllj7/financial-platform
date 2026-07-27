import axiosInstance from "./axiosInstance";

export const getMyDashboardSummary = async (month) => {
  const response = await axiosInstance.get("/dashboard/me/summary", { params: { month } });
  return response.data;
};

export const getMyDashboardTrend = async (days = 7) => {
  const response = await axiosInstance.get("/dashboard/me/trend", { params: { days } });
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
