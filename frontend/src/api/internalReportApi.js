import axiosInstance from "./axiosInstance";

export const generateInternalReport = async ({
  departmentFilter,
  periodStart,
  periodEnd,
  riskThreshold,
  reportType,
}) => {
  const response = await axiosInstance.post("/report/internal-report/generate", {
    departmentFilter,
    periodStart,
    periodEnd,
    riskThreshold,
    reportType,
  });
  return response.data;
};

export const getInternalReportList = async () => {
  const response = await axiosInstance.get("/report/internal-report");
  return response.data;
};

export const getInternalReportById = async (id) => {
  const response = await axiosInstance.get(`/report/internal-report/${id}`);
  return response.data;
};

export const deleteInternalReport = async (id) => {
  const response = await axiosInstance.delete(`/report/internal-report/${id}`);
  return response.data;
};
