import axiosInstance from "./axiosInstance";

export const getEvidenceChecklist = async ({ departmentId, targetYear }) => {
  const response = await axiosInstance.get("/report/evidence/checklist", {
    params: { departmentId, targetYear },
  });
  return response.data;
};

export const getEvidenceSummary = async (targetYear) => {
  const response = await axiosInstance.get("/report/evidence/summary", {
    params: { targetYear },
  });
  return response.data;
};

export const updateEvidenceItemResult = async ({ departmentId, targetYear, itemNo, result }) => {
  const response = await axiosInstance.patch(`/report/evidence/${itemNo}/result`, {
    departmentId,
    targetYear,
    result,
  });
  return response.data;
};

export const generateEvidenceItem = async ({ departmentId, targetYear, itemNo }) => {
  const response = await axiosInstance.post(`/report/evidence/${itemNo}/generate`, {
    departmentId,
    targetYear,
  });
  return response.data;
};
