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
