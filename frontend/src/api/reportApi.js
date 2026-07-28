import axiosInstance from "./axiosInstance";

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
