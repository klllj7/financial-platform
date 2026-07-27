import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ResetPasswordPage.css";

function ResetPasswordPage() {
  const navigate = useNavigate();

  // 비밀번호 재설정 요청 입력값
  const [email, setEmail] = useState("");

  // 화면에 보여줄 안내 메시지
  const [resultMessage, setResultMessage] = useState("");

  // 비밀번호 재설정 요청 버튼 클릭
  const handleResetRequestSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setResultMessage("이메일을 입력해주세요.");
      return;
    }

    /*
      지금은 화면 구현 단계라 실제 이메일 발송/API 호출은 하지 않는다.
      다음 단계에서 POST /api/auth/password-reset/request API를 붙일 예정이다.
    */
    setResultMessage(
      "입력하신 이메일이 가입된 계정과 일치하는 경우, 비밀번호 재설정 절차가 진행됩니다."
    );
  };

  return (
    <main className="reset-password-page">
      <section className="reset-password-card">
        <div className="reset-password-header">
          <p>Password Recovery</p>
          <h1>비밀번호 찾기</h1>
          <span>
            가입한 이메일을 입력하면 비밀번호 재설정 절차를 진행할 수 있습니다.
          </span>
        </div>

        <form
          className="reset-password-form"
          onSubmit={handleResetRequestSubmit}
        >
          <div className="reset-password-form-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="가입한 이메일을 입력해주세요"
            />
          </div>

          {resultMessage && (
            <div className="reset-password-result-message">
              {resultMessage}
            </div>
          )}

          <button type="submit" className="reset-password-submit-button">
            비밀번호 재설정 요청
          </button>
        </form>

        <div className="reset-password-actions">
          <button type="button" onClick={() => navigate("/login")}>
            로그인 화면으로 돌아가기
          </button>
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordPage;