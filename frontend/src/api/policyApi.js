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

// 정책 반려 (사유 포함)
export const rejectPolicy = async (id, reject_reason) => {
  try {
    const response = await axiosInstance.patch(`/policies/${id}/reject`, { reject_reason });
    return response.data;
  } catch (error) {
    throw error;
  }
};