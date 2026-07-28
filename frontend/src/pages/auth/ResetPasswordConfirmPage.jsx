import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "../../api/authApi";
import "./ResetPasswordConfirmPage.css";

function ResetPasswordConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL query string에서 비밀번호 재설정 토큰을 가져온다.
  // 예: /reset-password/confirm?token=xxxxx
  const resetToken = searchParams.get("token");

  // API 요청 중인지 확인하는 상태
  const [isLoading, setIsLoading] = useState(false);

  // 새 비밀번호 입력값
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    newPasswordConfirm: "",
  });

  // 화면에 보여줄 안내 메시지
  const [resultMessage, setResultMessage] = useState("");

  // input 값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 새 비밀번호 설정 버튼 클릭
  const handlePasswordConfirmSubmit = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      setResultMessage("유효하지 않은 접근입니다. 비밀번호 찾기 화면에서 다시 요청해주세요.");
      return;
    }

    if (!passwordForm.newPassword || !passwordForm.newPasswordConfirm) {
      setResultMessage("새 비밀번호와 비밀번호 확인을 모두 입력해주세요.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setResultMessage("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      setIsLoading(true);
      setResultMessage("");

      /*
        재설정 토큰과 새 비밀번호를 백엔드로 전달
        백엔드는 토큰 검증 후 비밀번호를 암호화하여 저장 
      */
      await confirmPasswordReset({
        resetToken,
        newPassword: passwordForm.newPassword,
      });

      alert("비밀번호가 변경되엇습니다. 새 비밀번호로 로그인해주세요.");

      navigate("/login", { replace: true, });
    } catch (error) {
      console.error("비밀번호 변경 실패: ", error);

      setResultMessage(error.response?.data?.error?.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="reset-confirm-page">
      <section className="reset-confirm-card">
        <div className="reset-confirm-header">
          <p>Password Reset</p>
          <h1>새 비밀번호 설정</h1>
          <span>
            사용할 새 비밀번호를 입력해주세요. 비밀번호 확인까지 일치해야 합니다.
          </span>
        </div>

        <form
          className="reset-confirm-form"
          onSubmit={handlePasswordConfirmSubmit}
        >
          <div className="reset-confirm-form-group">
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handleInputChange}
              placeholder="새 비밀번호를 입력해주세요"
            />
          </div>

          <div className="reset-confirm-form-group">
            <label htmlFor="newPasswordConfirm">새 비밀번호 확인</label>
            <input
              id="newPasswordConfirm"
              name="newPasswordConfirm"
              type="password"
              value={passwordForm.newPasswordConfirm}
              onChange={handleInputChange}
              placeholder="새 비밀번호를 한 번 더 입력해주세요"
            />
          </div>

          {resultMessage && (
            <div className="reset-confirm-result-message">
              {resultMessage}
            </div>
          )}

          <button 
            type="submit" 
            className="reset-confirm-submit-button"
            disabled={isLoading}
          >
            {isLoading ? "변경 중..." : "새 비밀번호 설정"}
          </button>
        </form>

        <div className="reset-confirm-footer">
          <button type="button" onClick={() => navigate("/login")}>
            로그인 화면으로 돌아가기
          </button>
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordConfirmPage;