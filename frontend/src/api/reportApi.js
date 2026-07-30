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

export const uploadEvidenceItem = async ({ departmentId, targetYear, itemNo, file }) => {
  const formData = new FormData();
  formData.append("departmentId", departmentId);
  formData.append("targetYear", targetYear);
  formData.append("file", file);
  // Content-Type을 직접 지정하지 않는다 — FormData를 넘기면 axios가
  // boundary 포함 multipart/form-data 헤더를 자동으로 붙여준다.
  const response = await axiosInstance.post(`/report/evidence/${itemNo}/upload`, formData);
  return response.data;
};
