const authService = require("./auth.service");
const { success, fail } = require("../../common/utils/response");

// 회원가입 controller
const signup = async (req, res) => {
  try {
    // 로컬 환경에서는 req.ip가 ::1로 들어올 수 있으므로 확인하기 쉬운 IPv4 형식으로 변환
    const userIp = req.ip === "::1" ? "127.0.0.1" : req.ip;

    const result = await authService.signup({
      ...req.body, 
      userIp,
      userAgent: req.headers["user-agent"] || null,
    });

    return success(res, result, 201);
  } catch (error) {
    return fail(
      res,
      error.code || "AUTH_SIGNUP_FAILED",
      error.message || "회원가입에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 로그인 Controller
const login = async (req, res) => {
  try {
    // 로컬 개발 환경에서는 req.ip가 ::1로 들어올 수 있음
    // ::1은 localhost라는 뜻이므로 보기 쉬운 127.0.0.1로만 변환
    const ipAddress = req.ip === "::1" ? "127.0.0.1" : req.ip;

    const result = await authService.login({
      ...req.body,

      // 로그인 요청 IP 주소
      ipAddress,

      // 브라우저/OS 등 접속 환경 정보
      userAgent: req.headers["user-agent"],
    });

    return success(res, result, 200);
  } catch (error) {
    console.error("로그인 실패 상세:", error);

    return fail(
      res,
      error.code || "AUTH_LOGIN_FAILED",
      error.message || "로그인에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 내 정보 조회 Controller
const getMe = async (req, res) => {
  try {
    // authMiddleware에서 req.user에 userId를 넣어줌
    const result = await authService.getMe(req.user.userId);

    return success(res, result, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "AUTH_ME_FAILED",
      error.message || "내 정보 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 아이디 찾기 Controller
const findEmail = async (req, res) => {
  try {
    const result = await authService.findEmail(req.body);

    return success(res, result, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "AUTH_FIND_EMAIL_FAILED",
      error.message || "아이디 찾기에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 비밀번호 재설정 요청 Controller
const requestPasswordReset = async (req, res) => {
  try {
    const result = await authService.requestPasswordReset(req.body);

    return success(res, result, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "AUTH_PASSWORD_RESET_REQUEST_FAILED",
      error.message || "비밀번호 재설정 요청에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 새 비밀번호 설정 Controller
const confirmPasswordReset = async (req, res) => {
  try {
    const result = await authService.confirmPasswordReset(req.body);

    return success(res, result, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "AUTH_PASSWORD_RESET_CONFIRM_FAILED",
      error.message || "비밀번호 변경에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 부서 목록 조회 Controller
const getDepartments = async (req, res) => {
  try {
    const departments = await authService.getDepartments();

    return success(res, departments, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "AUTH_DEPARTMENTS_FAILED",
      error.message || "부서 목록 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

module.exports = {
  signup,
  login,
  getMe,
  findEmail,
  requestPasswordReset,
  confirmPasswordReset,
  getDepartments,
};