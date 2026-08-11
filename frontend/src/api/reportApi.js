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

export const exportEvidenceChecklistXlsx = async ({ departmentId, targetYear }) => {
  const response = await axiosInstance.get("/report/evidence/export/checklist.xlsx", {
    params: { departmentId, targetYear },
    responseType: "blob",
  });
  return response.data;
};

export const exportEvidenceZip = async ({ departmentId, targetYear }) => {
  const response = await axiosInstance.get("/report/evidence/export/zip", {
    params: { departmentId, targetYear },
    responseType: "blob",
  });
  return response.data;
};

export const addEvidenceLogEntry = async ({ departmentId, targetYear, itemNo, entry }) => {
  const response = await axiosInstance.post(`/report/evidence/${itemNo}/log-entries`, {
    departmentId,
    targetYear,
    entry,
  });
  return response.data;
};

export const confirmEvidenceDraft = async ({
  departmentId,
  targetYear,
  itemNo,
  draftContent,
  editedContent,
  stats,
  isEdited,
}) => {
  const response = await axiosInstance.patch(`/report/evidence/${itemNo}/draft`, {
    departmentId,
    targetYear,
    draftContent,
    editedContent,
    stats,
    isEdited,
  });
  return response.data;
};

export const uploadEvidenceItem = async ({ departmentId, targetYear, itemNo, file }) => {
  const formData = new FormData();
  formData.append("departmentId", departmentId);
  formData.append("targetYear", targetYear);
  formData.append("file", file);
  // axiosInstance 기본 헤더가 application/json으로 고정돼 있어서, 그대로 두면
  // axios가 FormData를 multipart로 안 보내고 JSON 문자열로 바꿔버려 파일이 사라진다
  // (node_modules/axios/lib/defaults/index.js의 transformRequest 참고).
  // Content-Type을 undefined로 지워야 axios/브라우저가 boundary 포함
  // multipart/form-data 헤더를 자동으로 붙여준다.
  const response = await axiosInstance.post(`/report/evidence/${itemNo}/upload`, formData, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};
