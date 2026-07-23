const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Role, Department } = require("./auth.models");

// 회원가입
const signup = async ({ name, email, password, department, role }) => {
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

  // 권한 코드로 권한 조회
  // role이 없으면 기본값은 EMPLOYEE
  const roleCode = role || "EMPLOYEE";

  const foundRole = await Role.findOne({
    where: { code: roleCode },
  });

  if (!foundRole) {
    const error = new Error("존재하지 않는 권한입니다.");
    error.statusCode = 400;
    error.code = "AUTH_003";
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
const login = async ({ email, password }) => {
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

module.exports = {
  signup,
  login,
  getMe,
};