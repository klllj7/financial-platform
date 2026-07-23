import axiosInstance from "./axiosInstance";

// 회원가입 API
// 실제 요청 주소: POST /api/auth/signup
export const signup = async (payload) => {
  const response = await axiosInstance.post("/auth/signup", payload);
  return response.data;
};

// 로그인 API
// 실제 요청 주소: POST /api/auth/login
export const login = async (payload) => {
  const response = await axiosInstance.post("/auth/login", payload);
  return response.data;
};

// 내 정보 조회 API
// 실제 요청 주소: GET /api/auth/me
export const getMe = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};