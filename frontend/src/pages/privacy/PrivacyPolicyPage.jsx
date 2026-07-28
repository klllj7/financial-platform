import { useNavigate } from "react-router-dom";
import "./PrivacyPolicyPage.css";

function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    /*
      개인정보처리방침 페이지
      현재 프로젝트에서는 시연용 문구로 작성한다.
      실제 서비스 운영 시에는 개인정보보호 담당자 또는 법무 검토가 필요하다.
    */
    <div className="privacy-page">
      <div className="privacy-container">
        <button
          type="button"
          className="privacy-back-button"
          onClick={() => navigate(-1)}
        >
          ← 이전 화면으로
        </button>

        <section className="privacy-card">
          <h1>개인정보처리방침</h1>

          <p className="privacy-description">
            ComplianceAI는 생성형 AI 사용 승인, 비식별 처리, 사용 이력 관리,
            감사 증적 생성을 지원하는 서비스입니다. 본 개인정보처리방침은
            서비스 이용 과정에서 처리되는 개인정보 항목과 보호 조치를 안내하기
            위해 작성되었습니다.
          </p>

          <div className="privacy-section">
            <h2>1. 수집하는 개인정보 항목</h2>
            <p>
              서비스는 회원가입, 로그인, AI 사용 신청 및 감사 이력 관리를 위해
              다음 정보를 처리할 수 있습니다.
            </p>

            <ul>
              <li>이름</li>
              <li>이메일</li>
              <li>소속 부서</li>
              <li>권한 정보</li>
              <li>로그인 이력</li>
              <li>AI 사용 신청 및 승인 이력</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>2. 개인정보의 이용 목적</h2>
            <p>
              수집된 정보는 사용자 인증, 권한 관리, AI 사용 승인 처리,
              민감정보 탐지 및 마스킹, 감사 로그 생성, 보안 사고 대응 목적으로
              이용됩니다.
            </p>
          </div>

          <div className="privacy-section">
            <h2>3. 개인정보의 보관 및 관리</h2>
            <p>
              서비스는 업무 수행 및 감사 대응에 필요한 범위 내에서 개인정보와
              사용 이력을 보관합니다. 불필요해진 개인정보는 내부 정책에 따라
              삭제 또는 비식별 처리될 수 있습니다.
            </p>
          </div>

          <div className="privacy-section">
            <h2>4. 개인정보 보호 조치</h2>
            <p>
              서비스는 비밀번호 암호화, 권한 기반 접근 제어, 로그인 이력 관리,
              민감정보 마스킹 등의 보호 조치를 적용합니다.
            </p>
          </div>

          <div className="privacy-section">
            <h2>5. 문의</h2>
            <p>
              개인정보 처리와 관련된 문의는 서비스 관리자 또는
              보안·컴플라이언스 담당 부서로 문의할 수 있습니다.
            </p>
          </div>

          <p className="privacy-notice">
            ※ 본 문서는 프로젝트 시연용 개인정보처리방침 예시이며, 실제 서비스
            운영 시에는 법적 검토가 필요합니다.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;