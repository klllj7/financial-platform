const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Role, Department, LoginHistory } = require("./auth.models");

// 비밀번호 규칙 검증
// 프론트 검증은 우회될 수 있으므로 백엔드에서도 동일하게 검사한다.
const validatePassword = (password) => {
  // 비밀번호 값이 없으면 에러 반환
  if (!password) {
    return "비밀번호를 입력해주세요.";
  }

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
  if (!/[!@#$%^]/.test(password)) {
    return "비밀번호에는 특수문자 !@#$%^ 중 1자 이상이 포함되어야 합니다.";
  }

  // 연속된 숫자 3자리 이상 금지
  // 예: 123, 234, 345, 456, 567, 678, 789
  const sequentialNumbers = [
    "012", "123", "234", "345", "456", "567", "678", "789",
  ];

  const hasSequentialNumber = sequentialNumbers.some((number) =>
    password.includes(number)
  );

  if (hasSequentialNumber) {
    return "연속된 숫자 3자리 이상은 사용할 수 없습니다.";
  }

  // 생년월일로 자주 쓰이는 8자리 숫자 패턴 금지
  // 예: 19990101, 20001231
  if (/(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(password)) {
    return "생년월일 형식은 비밀번호에 사용할 수 없습니다.";
  }

  // 생년월일로 자주 쓰이는 6자리 숫자 패턴 금지
  // 예: 990101, 001231
  if (/\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])/.test(password)) {
    return "생년월일 형식은 비밀번호에 사용할 수 없습니다.";
  }

  // 휴대폰 번호 형식 금지
  // 예: 01012345678, 010-1234-5678
  if (/01[016789]-?\d{3,4}-?\d{4}/.test(password)) {
    return "전화번호 형식은 비밀번호에 사용할 수 없습니다.";
  }

  // 모든 규칙을 통과하면 빈 문자열 반환
  return "";
};

// 회원가입
const signup = async ({ name, email, password, department }) => {
  // 회원가입 요청값 기본 검증
  if (!name || !email || !password || !department) {
    const error = new Error("필수 항목을 모두 입력해주세요.");
    error.statusCode = 400;
    error.code = "AUTH_SIGNUP_REQUIRED";
    throw error;
  }

  // 비밀번호 규칙 검증
  // 프론트에서 검증하더라도 API 직접 요청 막기 위해 백엔드에서도 다시 검사
  const passwordErrorMessage = validatePassword(password);

  if (passwordErrorMessage) {
    const error = new Error(passwordErrorMessage);
    error.statusCode = 400;
    error.code = "AUTH_INVALID_PASSWORD";
    throw error;
  }
  
  // 이미 가입된 이메일인지 확인
  const existingUser = await User.findOne({ where: { email }, });

  if (existingUser) {
    const error = new Error("이미 사용 중인 이메일입니다.");
    error.statusCode = 409;
    error.code = "AUTH_001";
    throw error;
  }

  // 부서 코드로 부서 조회
  const foundDepartment = await Department.findOne({
    where: { code: department },
  });

  if (!foundDepartment) {
    const error = new Error("존재하지 않는 부서입니다.");
    error.statusCode = 400;
    error.code = "AUTH_002";
    throw error;
  }

  // 회원가입 시 일반 사용자는 무조건 EMPLOYEE 권한으로 가입된다.
  // ADMIN, COMPLIANCE_MANAGER 권한은 회원가입 단계에서 선택하지 않고,
  // 가입 후 관리자가 계정 관리 화면에서 변경한다.
  const foundRole = await Role.findOne({
    where: { code: "EMPLOYEE" },
  });

  if (!foundRole) {
    const error = new Error("기본 권한 정보를 찾을 수 없습니다.");
    error.statusCode = 500;
    error.code = "AUTH_DEFAULT_ROLE_NOT_FOUND";
    throw error;
  }

  // 비밀번호 암호화
  const hashedPassword = await bcrypt.hash(password, 10);

  // 사용자 생성
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    departmentId: foundDepartment.id,
    roleId: foundRole.id,
  });

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    department: foundDepartment.name,
    role: foundRole.code,
  };
};

// 로그인
const login = async ({ email, password, ipAddress, userAgent }) => {
  // 이메일로 사용자 조회
  const user = await User.findOne({
    where: { email },
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "code", "name"],
      },
      {
        model: Role,
        as: "role",
        attributes: ["id", "code", "name"],
      },
    ],
  });

  if (!user) {
    const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    error.statusCode = 401;
    error.code = "AUTH_004";
    throw error;
  }

  // 비밀번호 비교
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    error.statusCode = 401;
    error.code = "AUTH_004";
    throw error;
  }

  // 계정 상태 확인
  // 관리자가 비활성화한 계정은 비밀번호가 맞아도 로그인할 수 없음
  if (user.status === "INACTIVE") {
    const error = new Error("비활성화된 계정입니다. 관리자에게 문의해주세요.");
    error.statusCode = 403;
    error.code = "AUTH_ACCOUNT_INACTIVE";
    throw error;
  }

  // 로그인 성공 이력 저장
  // 사용자가 정상적으로 로그인했을 때 로그인 시각, IP, 접속 환경을 기록
  await LoginHistory.create({
    userId: user.id,
    status: "SUCCESS",
    ipAddress,
    userAgent,
  });

  // JWT 토큰 발급
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roleCode: user.role.code,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    }
  );

  return {
    token,
    user: {
      userId: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role.code,
    },
  };
};

// 내 정보 조회
const getMe = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "status"],
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "code", "name"],
      },
      {
        model: Role,
        as: "role",
        attributes: ["id", "code", "name"],
      },
    ],
  });

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.statusCode = 404;
    error.code = "AUTH_005";
    throw error;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    department: user.department,
    role: user.role,
  };
};

// 이메일 마스킹 처리
// 아이디 찾기 결과에서 전체 이메일을 그대로 노출하지 않기 위해 일부만 보여준다.
const maskEmail = (email) => {
  const [emailId, domain] = email.split("@");

  // 이메일 형식이 아니면 원본 대신 빈 문자열 반환
  if (!emailId || !domain) {
    return "";
  }

  // 이메일 아이디가 2글자 이하인 경우 첫 글자만 보여준다.
  if (emailId.length <= 2) {
    return `${emailId.charAt(0)}*@${domain}`;
  }

  // 아이디 앞 2글자만 보여주고 나머지는 * 처리
  const visibleId = emailId.slice(0, 2);
  const maskedId = `${visibleId}${"*".repeat(Math.max(emailId.length - 2))}`;

  return `${maskedId}@${domain}`;
};

// 아이디 찾기
// 사용자가 입력한 이름과 부서 코드가 일치하는 계정을 조회한다.
const findEmail = async ({ name, department }) => {
  if (!name || !department) {
    const error = new Error("이름과 부서를 모두 입력해주세요.");
    error.statusCode = 400;
    error.code = "AUTH_FIND_EMAIL_REQUIRED";
    throw error;
  }

  const user = await User.findOne({
    where: { name },
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "code", "name"],
        where: {
          code: department,
        },
      },
      {
        model: Role,
        as: "role",
        attributes: ["id", "code", "name"],
      },
    ],
  });

  if (!user) {
    const error = new Error("입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
    error.statusCode = 404;
    error.code = "AUTH_EMAIL_NOT_FOUND";
    throw error;
  }

  return {
    maskedEmail: maskEmail(user.email),
    name: user.name,
    department: user.department.name,
  };
};

// 비밀번호 재설정 토큰 요청
// 사용자가 이메일을 입력하면 해당 계정이 존재하는지 확인하고,
// 개발 단계에서는 이메일 발송 대신 resetToken을 응답으로 반환한다.
const requestPasswordReset = async ({ email }) => {
  if (!email) {
    const error = new Error("이메일을 입력해주세요.");
    error.statusCode = 400;
    error.code = "AUTH_RESET_EMAIL_REQUIRED";
    throw error;
  }

  const user = await User.findOne({
    where: { email },
  });

  if (!user) {
    const error = new Error("입력하신 이메일과 일치하는 계정을 찾을 수 없습니다.");
    error.statusCode = 404;
    error.code = "AUTH_RESET_USER_NOT_FOUND";
    throw error;
  }

  // 비활성 계정은 비밀번호 재설정을 진행할 수 없도록 처리
  if (user.status === "INACTIVE") {
    const error = new Error("비활성화된 계정입니다. 관리자에게 문의해주세요.");
    error.statusCode = 403;
    error.code = "AUTH_ACCOUNT_INACTIVE";
    throw error;
  }

  /*
    비밀번호 재설정용 JWT 토큰
    일반 로그인 토큰과 구분하기 위해 purpose 값을 password_reset으로 넣는다.
    실제 서비스에서는 이 토큰을 이메일 링크로 보내야 한다.
  */
  const resetToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      purpose: "password_reset",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );

  return {
    message: "비밀번호 재설정 토큰이 생성되었습니다.",
    resetToken,
  };
};

// 새 비밀번호 설정
// resetToken을 검증한 뒤 사용자의 비밀번호를 새 값으로 변경한다.
const confirmPasswordReset = async ({ resetToken, newPassword }) => {
  if (!resetToken || !newPassword) {
    const error = new Error("재설정 토큰과 새 비밀번호를 모두 입력해주세요.");
    error.statusCode = 400;
    error.code = "AUTH_RESET_REQUIRED";
    throw error;
  }

  let decoded;

  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch (error) {
    const invalidTokenError = new Error("비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.");
    invalidTokenError.statusCode = 401;
    invalidTokenError.code = "AUTH_RESET_INVALID_TOKEN";
    throw invalidTokenError;
  }

  // 로그인 토큰을 비밀번호 재설정에 잘못 사용하는 것을 방지
  if (decoded.purpose !== "password_reset") {
    const error = new Error("유효하지 않은 비밀번호 재설정 요청입니다.");
    error.statusCode = 401;
    error.code = "AUTH_RESET_INVALID_PURPOSE";
    throw error;
  }

  // 회원가입과 동일한 비밀번호 규칙 적용
  const passwordErrorMessage = validatePassword(newPassword);

  if (passwordErrorMessage) {
    const error = new Error(passwordErrorMessage);
    error.statusCode = 400;
    error.code = "AUTH_INVALID_PASSWORD";
    throw error;
  }

  const user = await User.findByPk(decoded.userId);

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.statusCode = 404;
    error.code = "AUTH_RESET_USER_NOT_FOUND";
    throw error;
  }

  if (user.status === "INACTIVE") {
    const error = new Error("비활성화된 계정입니다. 관리자에게 문의해주세요.");
    error.statusCode = 403;
    error.code = "AUTH_ACCOUNT_INACTIVE";
    throw error;
  }

  // 새 비밀번호를 bcrypt로 암호화해서 저장
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await user.save();

  return {
    message: "비밀번호가 변경되었습니다.",
  };
};

module.exports = {
  signup,
  login,
  getMe,
  findEmail,
  requestPasswordReset,
  confirmPasswordReset,
};