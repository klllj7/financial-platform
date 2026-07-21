import axios from "axios";

// 백엔드 API 호출에 공통으로 사용할 axios 인스턴스
const axiosInstance = axios.create({
  // vite proxy 설정 때문에 /api만 적어도 백엔드 8080으로 전달됨
  baseURL: "/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// 요청을 보내기 전에 실행되는 인터셉터
// 나중에 로그인 토큰이 생기면 모든 요청에 자동으로 Authorization 헤더를 붙여줌
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;