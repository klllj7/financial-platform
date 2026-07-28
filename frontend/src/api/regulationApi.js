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
// 정책-조항 매핑 생성
export const createMapping = async (clausesId, policyId) =>{
    const response = await axiosInstance.post(`/regulations/clauses/${clausesId}/mappings`, { policy_id: policyId });
    return response.data;
};
// 정책-조항 매핑 삭제
export const deleteMapping = async (clausesId, policyId) =>{
    const response = await axiosInstance.delete(`/regulations/clauses/${clausesId}/mappings`,{ data: { policy_id: policyId } });
    return response.data;
};