import axiosInstance from "./axiosInstance";

/* 로그인 사용자가 볼 수 있는 전체 공지사항을 조회한다. */
export const getNotices = async () => {
  const response = await axiosInstance.get("/notices");
  return response.data;
};

/* 컴플라이언스 담당자 또는 관리자가 공지사항을 등록한다. */
export const createNotice = async (payload) => {
  const response = await axiosInstance.post("/notices", payload);
  return response.data;
};

/* 등록된 공지사항 내용을 수정한다. */
export const updateNotice = async (noticeId, payload) => {
  const response = await axiosInstance.put(`/notices/${noticeId}`, payload);
  return response.data;
};

/* 등록된 공지사항을 삭제한다. */
export const deleteNotice = async (noticeId) => {
  const response = await axiosInstance.delete(`/notices/${noticeId}`);
  return response.data;
};
