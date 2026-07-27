const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Role, Department, LoginHistory } = require("./auth.models");

// 회원가입
const signup = async ({ name, email, password, department }) => {
  // 이미 가입된 이메일인지 확인
  const existingUser = await User.findOne({
    where: { email },
  });

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

module.exports = {
  signup,
  login,
  getMe,
  findEmail,
};