import axiosInstance from "./axiosInstance";

//규제 문서 목록 조회
export const getDocuments = async () =>{
    const response = await axiosInstance.get("/regulations/documents");
    return response.data;
};
//특정 문서의 조항 목록 조회
export const getClauses = async (docId, search) =>{
    const query = search ? `?search=${search}` : "";
    const response = await axiosInstance.get(`/regulations/documents/${docId}/clauses${query}`);
    return response.data;
};
//법령 문서 등록
export const createDocument = async (docName) => {
    const response = await axiosInstance.post("/regulations/documents", { doc_name: docName });
    return response.data;
};

//조항 등록 (파일 업로드 포함 가능)
export const createClause = async (docId, clauseData, file) => {
    // 파일을 같이 보내야 해서 일반 객체 대신 FormData를 사용한다.
    const formData = new FormData();
    formData.append("clause_no", clauseData.clause_no);
    formData.append("title", clauseData.title);
    formData.append("description", clauseData.description);

    // 파일을 선택했을 때만 추가한다 (필수 아님).
    // "file"이라는 이름은 백엔드 라우터의 upload.single("file")과 반드시 일치해야 한다.
    if (file) {
        formData.append("file", file);
    }

    const response = await axiosInstance.post(
        `/regulations/documents/${docId}/clauses`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
};