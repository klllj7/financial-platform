import axiosInstance from "./axiosInstance";

// 관리자 - 사용자 목록 조회 API
// 실제 요청 주소: GET /api/admin/users
export const getAdminUsers = async () => {
  const response = await axiosInstance.get("/admin/users");
  return response.data;
};

// 관리자 - 사용자 권한 변경 API
// 실제 요청 주소: PATCH /api/admin/users/:userId/role
export const updateAdminUserRole = async (userId, roleCode) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/role`, {roleCode, });

  return response.data;
};

// 관리자 - 사용자 상태 변경 API
// 실제 요청 주소: PATCH /api/admin/users/:userId/status
export const updateAdminUserStatus = async (userId, status) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/status`, {
    status,
  });

  return response.data;
};

// 관리자 - 권한 목록 조회 API
// 실제 요청 주소: GET /api/admin/roles
export const getAdminRoles = async () => {
  const response = await axiosInstance.get("/admin/roles");
  return response.data;
};

// 관리자 - 부서 목록 조회 API
// 실제 요청 주소: GET /api/admin/departments
export const getAdminDepartments = async () => {
  const response = await axiosInstance.get("/admin/departments");
  return response.data;
};