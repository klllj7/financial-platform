import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../api/authApi";
import "./ResetPasswordPage.css";

function ResetPasswordPage() {
  const navigate = useNavigate();

  // 비밀번호 재설정 요청 입력값
  const [email, setEmail] = useState("");

  // 화면에 보여줄 안내 메시지
  const [resultMessage, setResultMessage] = useState("");

  // API 요청 중인지 확인하는 상태
  const [isLoading, setIsLoading] = useState(false);

  // 비밀번호 재설정 요청 버튼 클릭
  const handleResetRequestSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setResultMessage("이메일을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setResultMessage("");

      /*
        이메일을 백엔드로 보내 비밀번호 재설정 토큰을 요청한다.
        현재는 이메일 발송 기능이 없으므로 개발 단계에서 resetToken을 응답으로 받아
        새 비밀번호 설정 화면으로 이동시킨다.
      */
      const result = await requestPasswordReset({ email, });

      const resetToken = result.data.resetToken;

      navigate(`/reset-password/confirm?token=${resetToken}`);
    } catch (error) {
      console.error("비밀번호 재설정 요청 실패: ", error);

      setResultMessage(
        error.response?.data?.error?.message || "비밀번호 재설정 요청에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
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

          <button 
            type="submit" 
            className="reset-password-submit-button"
            disabled={isLoading}
          >
            {isLoading ? "요청 중..." : "비밀번호 재설정 요청"}
          </button>
        </form>

        <div className="reset-password-actions">
          <button type="button" onClick={() => navigate("/login")}>
            로그인 화면으로 돌아가기
          </button>
        </div>
      </section>
    </div>
  );
}

export default ResetPasswordPage;