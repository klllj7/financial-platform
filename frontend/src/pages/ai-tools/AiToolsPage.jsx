import {
  Bot,
  ClipboardList,
  Plus,
} from "lucide-react";

// AI Tool 신청 페이지 전용 CSS
import "./AiToolsPage.css";

function AiToolsPage() {
  return (
    <div className="ai-tools-page">
      {/* 페이지 제목 영역 */}
      <header className="ai-tools-heading">
        <div>
          {/* 페이지 제목 */}
          <h2>AI Tool 신청</h2>

          {/* 페이지 기능 안내 */}
          <p>
            업무에 필요한 AI Tool을 확인하고 사용 권한을
            신청할 수 있습니다.
          </p>
        </div>

        {/*
          아직 신청 폼은 만들지 않았기 때문에
          현재는 버튼 디자인만 먼저 표시한다.
        */}
        <button
          type="button"
          className="ai-tool-apply-button"
          onClick={() => {
            alert(
              "AI Tool 신청 기능은 다음 단계에서 구현합니다.",
            );
          }}
        >
          <Plus size={17} />
          AI Tool 신청하기
        </button>
      </header>

      {/* 페이지 상단 안내 카드 */}
      <section className="ai-tools-guide-card">
        {/* 안내 카드 아이콘 */}
        <div className="ai-tools-guide-icon">
          <Bot size={24} />
        </div>

        {/* 안내 카드 내용 */}
        <div className="ai-tools-guide-content">
          <strong>
            승인된 AI Tool만 업무에 사용할 수 있습니다.
          </strong>

          <p>
            신청한 Tool은 담당자의 검토 후 사용 권한이
            부여됩니다. 검토 결과는 마이 대시보드에서도
            확인할 수 있습니다.
          </p>
        </div>
      </section>

      {/* 신청 가능한 AI Tool 영역 */}
      <section className="ai-tools-section">
        <div className="ai-tools-section-header">
          <div>
            <h3>신청 가능한 AI Tool</h3>
            <p>
              현재 조직에서 신청할 수 있는 AI Tool 목록입니다.
            </p>
          </div>

          <span className="ai-tools-count">
            총 0개
          </span>
        </div>

        {/*
          다음 단계에서 실제 AI Tool 카드 목록을 넣을 예정이다.
          현재는 빈 상태 안내 화면을 먼저 표시한다.
        */}
        <div className="ai-tools-empty">
          <Bot size={30} />

          <strong>
            AI Tool 목록을 준비하고 있습니다.
          </strong>

          <p>
            다음 단계에서 ChatGPT Enterprise, Claude,
            Microsoft Copilot 등의 Tool 카드를 추가합니다.
          </p>
        </div>
      </section>

      {/* 내 신청 현황 영역 */}
      <section className="ai-tools-section">
        <div className="ai-tools-section-header">
          <div>
            <h3>내 신청 현황</h3>
            <p>
              내가 신청한 AI Tool의 처리 상태를 확인합니다.
            </p>
          </div>

          <ClipboardList size={19} />
        </div>

        {/*
          다음 단계에서 대시보드 Mock 데이터와 연결한다.
        */}
        <div className="ai-tools-empty">
          <ClipboardList size={30} />

          <strong>
            표시할 신청 내역이 없습니다.
          </strong>

          <p>
            AI Tool을 신청하면 검토 중, 승인 완료, 반려 상태가
            이곳에 표시됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}

export default AiToolsPage;