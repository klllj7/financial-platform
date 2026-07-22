import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../../api/authApi";
import "./SignupPage.css";

function SignupPage() {
  const navigate = useNavigate();

  // 회원가입 입력값을 관리하는 state
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    department: "",
    role: "EMPLOYEE",
  });

  // 에러 메시지 표시용 state
  const [errorMessage, setErrorMessage] = useState("");

  // input, select 값이 변경될 때 실행되는 함수
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setSignupForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 회원가입 버튼 클릭 시 실행되는 함수
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    // 간단한 필수값 검증
    if (
      !signupForm.name ||
      !signupForm.email ||
      !signupForm.password ||
      !signupForm.passwordConfirm ||
      !signupForm.department
    ) {
      setErrorMessage("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 비밀번호 확인 검증
    if (signupForm.password !== signupForm.passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try{
      setErrorMessage("");

      // 백엔드 회원가입 API에 보낼 데이터
      const payload = {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        department: signupForm.department,
        role: signupForm.role,
      };

      const result = await signup(payload);

      console.log("회원가입 성공: ", result);

      alert("회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.");

      // 회원가입 성공 후 로그인 페이지로 이동
      navigate("/login");
    } catch (error) {
      console.error("회원가입 실패: ", error);

      setErrorMessage(
        error.response?.data?.error?.message || "회원가입에 실패했습니다."
      );
    }
  };

  // 로그인 화면으로 이동
  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <main className="signup-page">
      <section className="signup-container">
        {/* 상단 브랜드 영역 */}
        <header className="signup-header">
          <h1>FINANCIAL PLATFORM</h1>
          <p>금융권 생성형 AI 사용 관리를 위한 컴플라이언스 플랫폼</p>
        </header>

        {/* 회원가입 카드 */}
        <section className="signup-card">
          <div className="signup-title-area">
            <p className="signup-sub-title">Create Account</p>
            <h2>회원가입</h2>
            <p>
              서비스 이용을 위해 사용자 정보를 입력해주세요.
              <br />
              기본 권한은 임직원으로 등록됩니다.
            </p>
          </div>

          <form className="signup-form" onSubmit={handleSignupSubmit}>
            {/* 이름 */}
            <div className="form-group">
              <label htmlFor="name">이름</label>
              <input
                id="name"
                name="name"
                type="text"
                value={signupForm.name}
                onChange={handleInputChange}
                placeholder="이름을 입력하세요"
              />
            </div>

            {/* 아이디 또는 이메일 */}
            <div className="form-group">
              <label htmlFor="email">아이디 또는 이메일</label>
              <input
                id="email"
                name="email"
                type="email"
                value={signupForm.email}
                onChange={handleInputChange}
                placeholder="example@company.com"
              />
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                value={signupForm.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="form-group">
              <label htmlFor="passwordConfirm">비밀번호 확인</label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                value={signupForm.passwordConfirm}
                onChange={handleInputChange}
                placeholder="비밀번호를 한 번 더 입력하세요"
              />
            </div>

            {/* 부서 선택 */}
            <div className="form-group">
              <label htmlFor="department">부서 선택</label>
              <select
                id="department"
                name="department"
                value={signupForm.department}
                onChange={handleInputChange}
              >
                <option value="">부서를 선택하세요</option>
                <option value="LOAN_REVIEW">여신심사팀</option>
                <option value="MARKETING">마케팅팀</option>
                <option value="IT_SECURITY">IT보안팀</option>
                <option value="COMPLIANCE">준법감시팀</option>
                <option value="CUSTOMER_SERVICE">고객지원팀</option>
              </select>
            </div>

            {/* 직무/권한 */}
            <div className="form-group">
              <label htmlFor="role">직무/권한</label>
              <select
                id="role"
                name="role"
                value={signupForm.role}
                onChange={handleInputChange}
              >
                <option value="EMPLOYEE">임직원</option>
                <option value="COMPLIANCE_MANAGER">보안/컴플라이언스 담당자</option>
                <option value="ADMIN">관리자</option>
              </select>
            </div>

            {/* 에러 메시지 */}
            {errorMessage && <p className="signup-error">{errorMessage}</p>}

            {/* 회원가입 버튼 */}
            <button className="signup-button" type="submit">
              회원가입
            </button>
          </form>

          {/* 로그인 화면 이동 */}
          <div className="login-link-area">
            <span>이미 계정이 있으신가요?</span>
            <button type="button" onClick={handleLoginClick}>
              로그인
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default SignupPage;