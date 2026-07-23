import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
// import { getHealthCheck } from "../../api/healthApi"; // backend server test
import "./LoginPage.css";

function LoginPage() {

  // 네비게이터
  const navigate = useNavigate();

  // 사용자가 입력한 아이디와 비밀번호를 저장하는 상태
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // 로그인 상태 유지 체크박스 상태
  const [keepLogin, setKeepLogin] = useState(false);

  // 아이디 저장 체크박스 상태
  const [saveId, setSaveId] = useState(false);  

  // backend server test
  /*const handleBackendCheck = async () => {
    try {
      const result = await getHealthCheck();

      console.log("백엔드 연결 성공: ", result);
      alert("백엔드 연결 성공!");
    } catch(error) {
      console.error("백엔드 연결 실패: ", error);
      alert("백엔드 연결 실패! backend 서버가 켜져 있는지 확인해주세요.");
    }
  };*/

  // input에 입력할 때마다 loginForm 값을 업데이트하는 함수
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 로그인 버튼 클릭 시 실행되는 함수
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginForm.email || !loginForm.password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const payload = {
        email: loginForm.email,
        password: loginForm.password,
      };

      const result = await login(payload);

      console.log("로그인 성공: ", result);

      // 백엔드 응답 구조
      const token = result.data.token;
      const user = result.data.user;

      // 토큰 저장
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert(`${user.name}님 로그인 성공!`);

      // 권한별 화면 이동은 나중에 실제 대시보드 만들면 연결
      if (user.role === "ADMIN") {
        navigate("/admin/accounts");
      // } else if (user.role === "COMPLIANCE_MANAGER") {
      //   navigate("/compliance/dashboard");
      } else {
        navigate("/my-dashboard");
      }
    } catch (error) {
      console.error("로그인 실패: ", error);
      alert(error.response?.data?.error?.message || "로그인에 실패했습니다.");
    }
  };

  // 회원가입 버튼 클릭 시 실행
  const handleSignupClick = () => {
    navigate("/signup");
  };

  // 아이디 찾기 버튼 클릭 시 실행
  const handleFindIdClick = () => {
    alert("아이디 찾기 기능은 추후 구현 예정입니다.");
  };

  // 비밀번호 찾기 버튼 클릭 시 실행
  const handleFindPasswordClick = () => {
    alert("비밀번호 찾기 기능은 추후 구현 예정입니다.");
  };

  return (
    <main className="login-page">
      <section className="login-container">
        {/* 왼쪽 서비스 소개/이미지 영역 */}
        <section className="login-left">
          <div className="login-left-content">
            <p className="service-badge">AI Financial Platform</p>

            <h1 className="login-left-title">
              금융권 생성형 AI 사용을
              <br />
              안전하게 관리하세요
            </h1>

            <p className="login-left-description">
              AI 사용 로그, 위험 이벤트, 정책 판단, 조치 이력을 한곳에서
              관리하고 규제 대응을 위한 증빙 자료를 체계적으로 정리합니다.
            </p>

            {/* 실제 이미지 대신 대시보드 느낌의 일러스트 카드 */}
            <div className="dashboard-preview">
              <div className="preview-header">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div className="preview-body">
                <div className="preview-card">
                  <p>Risk Events</p>
                  <strong>24</strong>
                  <span>이번 달 탐지 건수</span>
                </div>

                <div className="preview-chart">
                  <span className="chart-bar bar-1"></span>
                  <span className="chart-bar bar-2"></span>
                  <span className="chart-bar bar-3"></span>
                  <span className="chart-bar bar-4"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 오른쪽 로그인 영역 */}
        <section className="login-right">
          <div className="login-form-box">
            <div className="login-title-area">
              <p className="login-sub-title">Welcome back</p>
              <h2>로그인</h2>
              <p>
                계정 정보를 입력해주세요.
              </p>
            </div>

            <form className="login-form" onSubmit={handleLoginSubmit}>
              {/* 아이디 입력 */}
              <div className="form-group">
                <label htmlFor="email">아이디</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={loginForm.email}
                  onChange={handleInputChange}
                  placeholder="example@company.com"
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              {/* 체크박스 영역 */}
              <div className="login-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={keepLogin}
                    onChange={(e) => setKeepLogin(e.target.checked)}
                  />
                  <span>로그인 상태 유지</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveId}
                    onChange={(e) => setSaveId(e.target.checked)}
                  />
                  <span>아이디 저장</span>
                </label>
              </div>

              {/* 로그인 버튼 */}
              <button className="login-button" type="submit">
                로그인
              </button>

              {/* 백엔드 서버 연결 테스트 */}
              {/*<button className="backend-check-button" type="button" onClick={handleBackendCheck}>
                백엔드 연결 테스트
              </button>*/}
            </form>

            {/* 아이디/비밀번호 찾기 */}
            <div className="find-account-area">
              <button type="button" onClick={handleFindIdClick}>
                아이디 찾기
              </button>
              <span>|</span>
              <button type="button" onClick={handleFindPasswordClick}>
                비밀번호 찾기
              </button>
            </div>

            {/* 회원가입 */}
            <div className="signup-area">
              <span>아직 계정이 없으신가요?</span>
              <button type="button" onClick={handleSignupClick}>
                회원가입
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default LoginPage;