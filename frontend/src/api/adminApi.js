import axiosInstance from "./axiosInstance";

// 관리자 - 사용자 목록 조회 API
// 실제 요청 주소: GET /api/admin/users
export const getAdminUsers = async () => {
  const response = await axiosInstance.get("/admin/users");
  return response.data;
};