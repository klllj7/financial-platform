import axiosInstance from "./axiosInstance";

/* 로그인 사용자의 이전 채팅 목록을 조회한다. */
export const getChatSessions = async () => {
  const response = await axiosInstance.get("/chats/sessions");
  return response.data;
};

/* 선택한 채팅방의 전체 메시지를 조회한다. */
export const getChatMessages = async (sessionId) => {
  const response = await axiosInstance.get(
    `/chats/sessions/${sessionId}/messages`,
  );
  return response.data;
};

/* 이전 채팅의 핀 고정 상태를 변경한다. */
export const updateChatPin = async (sessionId, isPinned) => {
  const response = await axiosInstance.patch(
    `/chats/sessions/${sessionId}/pin`,
    { isPinned },
  );
  return response.data;
};

/* 새 질문을 보내고 저장된 사용자 메시지와 AI 답변을 받는다. */
export const sendChatMessage = async (payload) => {
  const response = await axiosInstance.post("/chats/messages", payload);
  return response.data;
};
