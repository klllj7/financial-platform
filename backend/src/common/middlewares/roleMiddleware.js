const { fail } = require("../utils/response");

// 특정 권한을 가진 사용자만 접근할 수 있게 검사하는 미들웨어
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // authMiddleware를 통과하지 못했거나 토큰 정보가 없는 경우
    if (!req.user) {
      return fail(res, "AUTH_REQUIRED", "인증 정보가 없습니다.", 401);
    }

    // 토큰에 들어있는 사용자 권한
    const userRole = req.user.roleCode;

    // 허용된 권한 목록에 현재 사용자 권한이 없으면 접근 거부
    if (!allowedRoles.includes(userRole)) {
      return fail(res, "AUTH_FORBIDDEN", "접근 권한이 없습니다.", 403);
    }

    next();
  };
};

module.exports = {
  authorize,
};