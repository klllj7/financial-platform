import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup, getDepartments } from "../../api/authApi";
import { Eye, EyeOff } from "lucide-react";
import "./SignupPage.css";

// 자주 쓰는 이메일 도메인. "직접 입력"을 고르면 도메인 칸을 비워서 직접 타이핑할 수 있다.
const EMAIL_DOMAIN_OPTIONS = [
  "naver.com",
  "daum.net",
  "gmail.com",
  "nate.com",
  "hanmail.net",
  "kakao.com",
  "outlook.com",
];
const CUSTOM_DOMAIN_VALUE = "__custom__";

const EMAIL_ID_PATTERN = /^[A-Za-z0-9._%+-]+$/;
const EMAIL_DOMAIN_PATTERN = /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;

// 아이디/도메인을 각각 검증해야 "naver" 처럼 점(.) 없는 도메인 오타를 잡아낼 수 있다.
const validateEmail = (emailId, emailDomain) => {
  if (!emailId || !emailDomain) {
    return "이메일을 입력해주세요.";
  }

  if (!EMAIL_ID_PATTERN.test(emailId)) {
    return "이메일 아이디에는 영문, 숫자, . _ % + - 만 사용할 수 있습니다.";
  }

  if (!EMAIL_DOMAIN_PATTERN.test(emailDomain)) {
    return "올바른 이메일 도메인 형식이 아닙니다. (예: naver.com)";
  }

  return "";
};

function SignupPage() {
  const navigate = useNavigate();

  // 회원가입 입력값을 관리하는 state
  const [signupForm, setSignupForm] = useState({
    name: "",
    password: "",
    passwordConfirm: "",
    department: "",

    // 필수 약관 동의 여부
    termsAgreed: false,
    privacyAgreed: false,
  });

  // 이메일은 아이디 + 도메인으로 나눠 입력받는다 (도메인은 선택 또는 직접입력).
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const composedEmail = emailId && emailDomain ? `${emailId}@${emailDomain}` : "";

  // 비밀번호 입력값 표시 여부
  const [showPassword, setShowPassword] = useState(false);

  // 비밀번호 확인 입력값 표시 여부
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // DB에서 조회한 부서 목록
  const [departments, setDepartments] = useState([]);

  // 에러 메시지 표시용 state
  const [errorMessage, setErrorMessage] = useState("");

  // input, select 값이 변경될 때 실행되는 함수
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSignupForm((prev) => ({
      ...prev,
      
      // 체크박스는 value가 아니라 checked 값을 저장
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 필수 약관 전체 동의/해제
  const handleAllAgreementChange = (e) => {
    const { checked } = e.target;

    setSignupForm((prev) => ({
      ...prev,
      termsAgreed: checked,
      privacyAgreed: checked,
    }));
  };

  const isAllAgreed = signupForm.termsAgreed && signupForm.privacyAgreed;

  // 부서 목록 조회
  const fetchDepartments = async () => {
    try {
      const result = await getDepartments();
      setDepartments(result.data);
    } catch (error) {
      console.error("부서 목록 조회 실패: ", error);
      setErrorMessage("부서 목록을 불러오지 못했습니다.");
    }
  };

  // 회원가입 버튼 클릭 시 실행되는 함수
  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    // 간단한 필수값 검증
    if (
      !signupForm.name ||
      !composedEmail ||
      !signupForm.password ||
      !signupForm.passwordConfirm ||
      !signupForm.department
    ) {
      setErrorMessage("필수 항목을 모두 입력해주세요.");
      return;
    }

    // 이메일 아이디/도메인 형식 검사
    const emailErrorMessage = validateEmail(emailId, emailDomain);

    if (emailErrorMessage) {
      setErrorMessage(emailErrorMessage);
      return;
    }

    // 비밀번호 규칙 검사
    const passwordErrorMessage = validatePassword(signupForm.password);

    if (passwordErrorMessage) {
      alert(passwordErrorMessage);
      return;
    }

    // 비밀번호 확인 검증
    if (signupForm.password !== signupForm.passwordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    // 필수 약관에 동의하지 않으면 회원가입 요청을 보내지 않는다.
    if (!signupForm.termsAgreed || !signupForm.privacyAgreed) {
      setErrorMessage("서비스 이용약관과 개인정보 수집·이용 안내에 모두 동의해주세요.");
      return;
    }

    try{
      setErrorMessage("");

      // 백엔드 회원가입 API에 보낼 데이터
      const payload = {
        name: signupForm.name,
        email: composedEmail,
        password: signupForm.password,
        department: signupForm.department,

        // 백엔드에서 필수 약관 동의 여부를 다시 검증
        termsAgreed: signupForm.termsAgreed,
        privacyAgreed: signupForm.privacyAgreed,
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

  const validatePassword = (password) => {
    // 8자 이상
    if (password.length < 8) {
      return "비밀번호는 8자 이상이어야 합니다.";
    }

    // 영문 포함
    if (!/[A-Za-z]/.test(password)) {
      return "비밀번호에는 영문이 1자 이상 포함되어야 합니다.";
    }

    // 숫자 포함
    if (!/[0-9]/.test(password)) {
      return "비밀번호에는 숫자가 1자 이상 포함되어야 합니다.";
    }

    // 허용된 특수문자 포함
    if (!/[!@#$%^*+=-]/.test(password)) {
      return "비밀번호에는 특수문자 !@#$%^*+=- 중 1자 이상이 포함되어야 합니다.";
    }

    // 연속된 숫자 3자리 이상 금지
    const sequentialNumbers = [
      "012", "123", "234", "345", "456", "567", "678", "789",
    ]

    const hasSequentialNumber = sequentialNumbers.some((number) => password.includes(number));

    if (hasSequentialNumber) {
      return "연속된 숫자 3자리 이상은 사용할 수 없습니다.";
    }

    // 생년월일로 자주 쓰이는 6자리 또는 8자리 숫자 패턴 금지
    if (/(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(password)) {
      return "생년월일 형식은 비밀번호에 사용할 수 없습니다.";
    }

    if (/\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(password)) {
      return "생년월일 형식은 비밀번호에 사용할 수 없습니다.";
    }

    // 휴대폰 번호 형식 금지
    if (/01[016789]-?\d{3,4}-?\d{4}/.test(password)) {
      return "전화번호 형식은 비밀번호에 사용할 수 없습니다.";
    }

    return "";
  };

  // 로그인 화면으로 이동
  const handleLoginClick = () => {
    navigate("/login");
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <div className="signup-page">
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
            <div className="form-group signup-full-width-group">
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

            {/* 이메일 */}
            <div className="form-group signup-full-width-group">
              <label htmlFor="emailId">이메일</label>
              <div className="signup-email-input-wrap">
                <input
                  id="emailId"
                  name="emailId"
                  type="text"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  placeholder="example"
                  autoComplete="username"
                />

                <span className="signup-email-at">@</span>

                <input
                  id="emailDomain"
                  name="emailDomain"
                  type="text"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                  placeholder="domain.com"
                />

                {/* 자주 쓰는 도메인을 고르면 위 도메인 입력칸에 채워준다. */}
                <select
                  className="signup-email-domain-select"
                  aria-label="이메일 도메인 선택"
                  value={
                    EMAIL_DOMAIN_OPTIONS.includes(emailDomain)
                      ? emailDomain
                      : ""
                  }
                  onChange={(e) => {
                    const { value } = e.target;
                    setEmailDomain(
                      !value || value === CUSTOM_DOMAIN_VALUE ? "" : value,
                    );
                  }}
                >
                  <option value="">도메인 선택</option>
                  {EMAIL_DOMAIN_OPTIONS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                  <option value={CUSTOM_DOMAIN_VALUE}>직접 입력</option>
                </select>
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>

              <p className="signup-password-rule">
                8자 이상, 영문/숫자/특수문자(!@#$%^*+=-)를 포함해주세요.
                <br />
                연속 숫자, 생년월일, 전화번호는 사용할 수 없습니다.
              </p>

              <div className="signup-password-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={signupForm.password}
                  onChange={handleInputChange}
                  placeholder="예: Secure1!"
                />

                <button 
                  type="button"
                  className="signup-password-toggle-button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="form-group">
              <label htmlFor="passwordConfirm">비밀번호 확인</label>
              
              <p className="signup-password-rule signup-password-rule-empty">
                입력한 비밀번호를 한 번 더 입력해주세요.
              </p>

              <div className="signup-password-input-wrap">
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  value={signupForm.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                />

                <button
                  type="button"
                  className="signup-password-toggle-button"
                  onClick={() => setShowPasswordConfirm((prev) => !prev)}
                  aria-label={
                    showPasswordConfirm ? "비밀번호 확인 숨기기" : "비밀번호 확인 보기"
                  }
                >
                  {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                {departments.map((department) => (
                  <option key={department.id} value={department.code}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 직무/권한 */}
            <div className="form-group">
              <label htmlFor="role">직무/권한</label>
              <p className="signup-role-notice">
                가입 후 기본 권한은 임직원으로 설정되며, 필요한 경우 관리자가 권한을 변경합니다.
              </p>
            </div>

            {/* 필수 약관 동의 */}
            <section className="signup-agreement-section">
              <label className="signup-agreement-all">
                <input
                  type="checkbox"
                  checked={isAllAgreed}
                  onChange={handleAllAgreementChange}
                />
                <span>필수 약관 전체 동의</span>
              </label>

              <div className="signup-agreement-divider" />

              {/* 서비스 이용약관 */}
              <div className="signup-agreement-row">
                <label className="signup-agreement-item">
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={signupForm.termsAgreed}
                    onChange={handleInputChange}
                  />
                  <span>
                    <strong>[필수]</strong> 서비스 이용약관 동의
                  </span>
                </label>

                <Link
                  to="/terms-of-service?from=signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="signup-agreement-link"
                >
                  전문보기
                </Link>
              </div>
              
              {/* 개인정보 수집·이용 동의 */}
              <div className="signup-agreement-row">
                <label className="signup-agreement-item">
                  <input
                    type="checkbox"
                    name="privacyAgreed"
                    checked={signupForm.privacyAgreed}
                    onChange={handleInputChange}
                  />
                  <span>
                    <strong>[필수]</strong> 개인정보 수집·이용 동의
                  </span>
                </label>

                <Link
                  to="/privacy-collection-consent?from=signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="signup-agreement-link"
                >
                  전문보기
                </Link>
              </div>
              
            </section>

            {/* 에러 메시지 */}
            {errorMessage && <p className="signup-error">{errorMessage}</p>}

            {/* 회원가입 버튼 */}
            <button className="signup-button" type="submit" disabled={!isAllAgreed}>
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
    </div>
  );
}

export default SignupPage;