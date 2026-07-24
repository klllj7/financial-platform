import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Eraser,
  LockKeyhole,
  MessageSquareText,
  Pin,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  getChatMessages,
  getChatSessions,
  sendChatMessage,
  updateChatPin,
} from "../../api/chatApi";

// AI 사용하기 화면에만 적용되는 스타일이다.
import "./AiChatPage.css";


/* 로그인 역할 코드를 화면에 표시할 이름으로 변환한다. */
const ROLE_LABELS = {
  EMPLOYEE: "임직원",
  COMPLIANCE_MANAGER: "컴플라이언스 담당자",
  ADMIN: "관리자",
};


function AiChatPage() {
  /* 현재 로그인한 사용자의 역할을 가져와 공통 화면에 표시한다. */
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const roleCode = user?.role?.code || user?.role || "EMPLOYEE";
  const roleLabel = ROLE_LABELS[roleCode] || "사용자";

  // 질문 입력창의 현재 내용이다.
  const [prompt, setPrompt] = useState("");

  // 사용자 질문과 AI 답변을 시간순으로 저장한다.
  const [messages, setMessages] = useState([]);

  // 왼쪽 패널에 표시할 이전 채팅과 고정 여부를 관리한다.
  const [chatHistory, setChatHistory] = useState([]);

  // 현재 화면에서 열어 보고 있는 이전 채팅의 ID다.
  const [activeChatId, setActiveChatId] = useState(null);

  // AI 답변을 기다리는 동안 중복 전송을 막는 상태다.
  const [isLoading, setIsLoading] = useState(false);

  // Mock/API 호출 실패 시 화면에 보여줄 오류 문구다.
  const [error, setError] = useState("");

  /* Sequelize 날짜와 역할 코드를 화면 메시지 형식으로 변환한다. */
  const formatMessage = (message) => ({
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    blocked: message.blocked,
    maskApplied: message.maskApplied,
    modelName: message.modelName,
    createdAt: new Date(message.createdAt).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  /* 페이지 진입 시 DB에 저장된 이전 채팅 목록을 조회한다. */
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await getChatSessions();
        setChatHistory(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        console.error("이전 채팅 조회 실패", requestError);
        setError("이전 채팅을 불러오지 못했습니다.");
      }
    };
    fetchSessions();
  }, []);

  /* 핀으로 고정된 대화를 먼저 보여주고 나머지는 최신순으로 유지한다. */
  const sortedChatHistory = useMemo(
    () => [...chatHistory].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)),
    [chatHistory],
  );


  /* 질문을 백엔드에 저장하고 서버에서 생성한 AI 답변을 추가한다. */
  const handleSend = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isLoading) {
      return;
    }

    setPrompt("");
    setError("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: trimmedPrompt,
        sessionId: activeChatId,
      });
      const { session, userMessage, assistantMessage } = response.data;

      setMessages((currentMessages) => [
        ...currentMessages,
        formatMessage(userMessage),
        formatMessage(assistantMessage),
      ]);
      setActiveChatId(session.id);
      setChatHistory((currentHistory) => {
        const withoutCurrent = currentHistory.filter((chat) => chat.id !== session.id);
        return [session, ...withoutCurrent];
      });
    } catch (requestError) {
      console.error("AI 답변 요청 실패", requestError);
      setError("AI 답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };


  /* Enter는 전송하고 Shift+Enter는 입력창 줄바꿈으로 사용한다. */
  const handlePromptKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };


  /* 새 대화를 시작할 때 기존 메시지와 오류 상태를 초기화한다. */
  const handleResetChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setPrompt("");
    setError("");
  };


  /* 이전 채팅을 선택하면 DB에 저장된 전체 메시지를 불러온다. */
  const handleHistorySelect = async (chat) => {
    try {
      setActiveChatId(chat.id);
      setError("");
      const response = await getChatMessages(chat.id);
      setMessages(
        Array.isArray(response.data)
          ? response.data.map(formatMessage)
          : [],
      );
    } catch (requestError) {
      console.error("채팅 메시지 조회 실패", requestError);
      setError("채팅 내용을 불러오지 못했습니다.");
    }
  };


  /* 핀 버튼을 누르면 대화를 상단에 고정하거나 고정을 해제한다. */
  const handlePinToggle = async (event, chatId) => {
    event.stopPropagation();
    const target = chatHistory.find((chat) => chat.id === chatId);
    if (!target) return;

    try {
      const response = await updateChatPin(chatId, !target.isPinned);
      setChatHistory((currentHistory) =>
        currentHistory.map((chat) =>
          chat.id === chatId ? response.data : chat,
        ),
      );
    } catch (requestError) {
      console.error("채팅 고정 변경 실패", requestError);
      setError("채팅 고정 상태를 변경하지 못했습니다.");
    }
  };


  return (
    <div className="ai-chat-page">
      {/* 모든 역할이 공통으로 보는 페이지 제목 영역 */}
      <header className="ai-chat-heading">
        <div>
          <div className="ai-chat-title-row">
            <h2>AI 사용하기</h2>
            <span>{roleLabel}</span>
          </div>
          <p>
            승인된 업무 범위 안에서 안전하게 생성형 AI를 사용할 수 있습니다.
          </p>
        </div>

        <button type="button" onClick={handleResetChat}>
          <Eraser size={16} />
          새 대화
        </button>
      </header>

      <div className="ai-chat-workspace">
        {/* 왼쪽: 이전 채팅을 확인하고 핀으로 고정하는 영역 */}
        <aside className="ai-chat-use-case-panel">
          <div className="ai-chat-panel-title">
            <MessageSquareText size={18} />
            <div>
              <h3>이전 채팅</h3>
              <p>대화를 선택하거나 핀으로 상단에 고정하세요.</p>
            </div>
          </div>

          <div className="ai-chat-history-list">
            {sortedChatHistory.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={
                  activeChatId === chat.id ? "active" : ""
                }
                onClick={() => handleHistorySelect(chat)}
              >
                <span className="ai-chat-history-icon">
                  <MessageSquareText size={15} />
                </span>
                <span className="ai-chat-history-content">
                  <strong>{chat.title}</strong>
                  <small>{new Date(chat.updatedAt).toLocaleDateString("ko-KR")}</small>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className={`ai-chat-pin-button ${chat.isPinned ? "pinned" : ""}`}
                  aria-label={chat.isPinned ? "채팅 고정 해제" : "채팅 고정"}
                  onClick={(event) => handlePinToggle(event, chat.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handlePinToggle(event, chat.id);
                    }
                  }}
                >
                  <Pin size={14} fill={chat.isPinned ? "currentColor" : "none"} />
                </span>
              </button>
            ))}
          </div>

          <div className="ai-chat-security-guide">
            <ShieldCheck size={18} />
            <div>
              <strong>보안 정책이 적용됩니다.</strong>
              <p>민감정보는 마스킹되며 고위험 요청은 차단될 수 있습니다.</p>
            </div>
          </div>
        </aside>

        {/* 오른쪽: 메시지와 질문 입력창이 있는 실제 채팅 영역 */}
        <section className="ai-chat-conversation-panel">
          <header className="ai-chat-conversation-header">
            <div className="ai-chat-bot-icon"><Bot size={20} /></div>
            <div className="ai-chat-conversation-title">
              <h3>ComplianceAI</h3>
              <p>질문 내용에 적합한 모델이 자동으로 선택됩니다.</p>
            </div>
            <span><i /> 보안 연결</span>
          </header>

          <div className="ai-chat-message-list">
            {messages.length === 0 ? (
              <div className="ai-chat-empty-state">
                <span><Bot size={30} /></span>
                <h3>무엇을 도와드릴까요?</h3>
                <p>질문을 입력하면 안전한 AI 업무 지원을 시작합니다.</p>
                <small>개인정보와 회사 기밀은 입력하지 마세요.</small>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`ai-chat-message ${message.role}`}
                >
                  <div className="ai-chat-message-avatar">
                    {message.role === "user" ? (
                      <UserRound size={17} />
                    ) : (
                      <Bot size={17} />
                    )}
                  </div>

                  <div className="ai-chat-message-body">
                    <div className="ai-chat-message-meta">
                      <strong>
                        {message.role === "user" ? "나" : "ComplianceAI"}
                      </strong>
                      <span>{message.createdAt}</span>
                    </div>

                    {message.blocked ? (
                      <div className="ai-chat-blocked-message">
                        <LockKeyhole size={18} />
                        <div>
                          <strong>요청이 차단되었습니다.</strong>
                          <p>{message.content}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="ai-chat-message-content">
                        {message.content}
                      </div>
                    )}

                    {message.maskApplied && (
                      <div className="ai-chat-mask-notice">
                        <ShieldCheck size={15} />
                        민감정보가 마스킹된 후 AI에 전달되었습니다.
                      </div>
                    )}

                    {message.modelName && (
                      <small className="ai-chat-model-name">
                        사용 모델 · {message.modelName}
                      </small>
                    )}
                  </div>
                </article>
              ))
            )}

            {isLoading && (
              <div className="ai-chat-loading">
                <span /><span /><span />
                AI가 답변을 생성하고 있습니다.
              </div>
            )}
          </div>

          {error && <div className="ai-chat-error">{error}</div>}

          <div className="ai-chat-composer">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handlePromptKeyDown}
              placeholder="AI에게 질문해 보세요."
              rows={3}
            />
            <footer>
              <span>Enter 전송 · Shift+Enter 줄바꿈</span>
              <button
                type="button"
                disabled={!prompt.trim() || isLoading}
                onClick={handleSend}
              >
                <Send size={16} />
                전송
              </button>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AiChatPage;
