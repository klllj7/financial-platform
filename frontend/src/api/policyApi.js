import axiosInstance from "./axiosInstance";

//정책 목록 조회
export const getPolicies = async () => {
        const response = await axiosInstance.get("/policies");
        return response.data;
};

//정책 생성
export const createPolicy = async (data) => {
        const response = await axiosInstance.post("/policies", data);
        return response.data;
};
// 정책 승인
export const approvePolicy = async (id) => {
  try {
    const response = await axiosInstance.patch(`/policies/${id}/approve`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 정책 반려 (사유/상세내용/보완요청사항/처리자 포함)
export const rejectPolicy = async (id, rejectPayload) => {
  try {
    const response = await axiosInstance.patch(`/policies/${id}/reject`, rejectPayload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 정책 수정
export const updatePolicy = async (id, data) => {
 const response = await axiosInstance.put(`/policies/${id}`, data);
  return response.data;
};

// 정책 활성화 여부만 변경 (규칙/버전은 그대로)
export const setPolicyActive = async (id, active_yn) => {
  const response = await axiosInstance.patch(`/policies/${id}/active`, { active_yn });
  return response.data;
};