import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ResetPasswordConfirmPage.css";

function ResetPasswordConfirmPage() {
  const navigate = useNavigate();

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
  const handlePasswordConfirmSubmit = (e) => {
    e.preventDefault();

    if (!passwordForm.newPassword || !passwordForm.newPasswordConfirm) {
      setResultMessage("새 비밀번호와 비밀번호 확인을 모두 입력해주세요.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setResultMessage("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    /*
      지금은 화면 구현 단계라 실제 비밀번호 변경은 하지 않는다.
      다음 단계에서 POST /api/auth/password-reset/confirm API를 붙일 예정이다.
    */
    setResultMessage(
      "새 비밀번호 설정 화면이 정상적으로 동작합니다. 다음 단계에서 API를 연동합니다."
    );
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

          <button type="submit" className="reset-confirm-submit-button">
            새 비밀번호 설정
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