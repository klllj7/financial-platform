import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, ShieldCheck, Settings } from "lucide-react";
import { login } from "../../api/authApi";
// import { getHealthCheck } from "../../api/healthApi"; // backend server test
import "./LoginPage.css";

// 테스트/데모 목적의 역할별 간편 로그인 프리셋.
// 실제 서비스 계정이 아니라, 데모용으로 미리 만들어둔 계정 정보다.
const QUICK_LOGIN_PRESETS = [
  { role: "EMPLOYEE", label: "임직원 로그인", email: "user@company.com", password: "Demo!2026", Icon: User },
  { role: "COMPLIANCE_MANAGER", label: "보안/컴플라이언스 로그인", email: "security@company.com", password: "Demo!2026", Icon: ShieldCheck },
  { role: "ADMIN", label: "관리자 로그인", email: "admin@company.com", password: "Demo!2026", Icon: Settings },
];

function LoginPage() {

  // 네비게이터
  const navigate = useNavigate();

  // 사용자가 입력한 아이디와 비밀번호를 저장하는 상태
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  // 로그인 상태 유지 체크박스 상태
  const [keepLogin, setKeepLogin] = useState(false);

  // 아이디 저장 체크박스 상태
  const [saveId, setSaveId] = useState(false);  

  // input에 입력할 때마다 loginForm 값을 업데이트하는 함수
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 실제 로그인 처리 (일반 로그인 폼 제출, 간편 로그인 버튼이 공통으로 사용)
  const submitLogin = async ({ email, password }) => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const result = await login({ email, password });

      console.log("로그인 성공: ", result);

      // 백엔드 응답 구조
      const token = result.data.token;
      const user = result.data.user;

      // 토큰 저장
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      alert(`${user.name}님 로그인 성공!`);

      const roleCode = user?.role?.code || user?.role;

      // 로그인한 역할에 맞는 기본 대시보드로 이동한다.
      if (roleCode === "ADMIN") {
        navigate("/admin/dashboard", {
          replace: true,
        });
      } else if (roleCode === "COMPLIANCE_MANAGER") {
        navigate("/compliance/dashboard", {
          replace: true,
        });
      } else {
        navigate("/my-dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("로그인 실패: ", error);
      alert(error.response?.data?.error?.message || "로그인에 실패했습니다.");
    }
  };

  // 로그인 버튼 클릭 시 실행되는 함수
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    await submitLogin(loginForm);
  };

  // 역할별 간편 로그인 버튼 클릭 시: 프리셋 계정으로 폼을 채우고 바로 로그인 처리
  const handleQuickLogin = async (preset) => {
    setLoginForm({ email: preset.email, password: preset.password });
    await submitLogin({ email: preset.email, password: preset.password });
  };

  // 회원가입 버튼 클릭 시 실행
  const handleSignupClick = () => {
    navigate("/signup");
  };

  // 아이디 찾기 버튼 클릭 시 실행
  const handleFindIdClick = () => {
    navigate("/find-id");
  };

  // 비밀번호 찾기 버튼 클릭 시 실행
  const handleFindPasswordClick = () => {
    navigate("/reset-password");
  };

  return (
    <div className="login-page">
      <section className="login-container">
        {/* 왼쪽 서비스 소개/이미지 영역 */}
        <section className="login-left">
          <div className="login-left-content">
            <p className="service-badge">ReguPilot</p>

            <h1 className="login-left-title">
              ReguPilot
              <br />
              금융권 생성형 AI 활용 모니터링 및 
              <br/>
              규제 증빙 자동화 플랫폼
            </h1>

            <p className="login-left-description">
              AI 사용 로그, 위험 이벤트, 정책 및 조치 이력을 한곳에서
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

                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={handleInputChange}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="current-password"
                  />

                  <button 
                    type="button"
                    className="password-toggle-button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                    title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? (<EyeOff size={19} />) : (<Eye size={19} />)}
                  </button>
                </div>
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

            {/* 테스트/데모용 역할별 간편 로그인 */}
            <div className="quick-login-area">
              <div className="quick-login-divider">
                <span />
                <p>자동로그인</p>
                <span />
              </div>

              <div className="quick-login-buttons">
                {QUICK_LOGIN_PRESETS.map((preset) => (
                  <button
                    key={preset.role}
                    type="button"
                    className="quick-login-button"
                    onClick={() => handleQuickLogin(preset)}
                  >
                    <preset.Icon size={16} />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

export default LoginPage;
