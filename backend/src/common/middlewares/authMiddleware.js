const jwt = require("jsonwebtoken");
const { fail } = require("../utils/response");

// JWT 토큰을 검증하는 미들웨어
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Authorization 헤더가 없거나 Bearer 형식이 아니면 실패
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return fail(res, "AUTH_TOKEN_REQUIRED", "인증 토큰이 없습니다.", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 이후 controller.service에서 사용할 수 있도록 req.user에 저장
    req.user = decoded;

    next();
  } catch (error) {
    return fail(res, "AUTH_INVALID_TOKEN", "유효하지 않은 토큰입니다.", 401);
  }
};

module.exports = {
  authenticate,
};