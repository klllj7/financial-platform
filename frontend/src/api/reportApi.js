import axiosInstance from "./axiosInstance";

// 상시평가 증빙자료 체크리스트 조회 API
// 실제 요청 주소: GET /api/report/evidence/checklist
export const getEvidenceChecklist = async ({ departmentId, targetYear }) => {
  const response = await axiosInstance.get("/report/evidence/checklist", {
    params: { departmentId, targetYear },
  });
  return response.data;
};

// 상시평가 증빙자료 항목 결과 수정 API
// 실제 요청 주소: PATCH /api/report/evidence/:itemNo/result
export const updateEvidenceItemResult = async ({ departmentId, targetYear, itemNo, result }) => {
  const response = await axiosInstance.patch(`/report/evidence/${itemNo}/result`, {
    departmentId,
    targetYear,
    result,
  });
  return response.data;
};
