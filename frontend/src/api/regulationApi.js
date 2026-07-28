import axiosInstance from "./axiosInstance";

//규제 문서 목록 조회
export const getDocuments = async () =>{
    const response = await axiosInstance.get("/regulations/documents");
    return response.data;
};
//특정 문서의 조항 목록 조회
export const getClauses = async (docId) =>{
    const response = await axiosInstance.get(`/regulations/documents/${docId}/clauses`);
    return response.data;
};