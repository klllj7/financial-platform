const express = require("express");
const adminController = require("./admin.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");

const router = express.Router();

// 관리자 - 전체 사용자 목록 조회
// 일단 로그인 토큰만 있으면 접근 가능하게 만들고,
// 다음 단계에서 ADMIN 권한 체크를 추가할 예정
router.get("/users", authenticate, adminController.getUsers);

// 관리자 - 사용자 권한 변경
router.patch("/users/:userId/role", authenticate, adminController.updateUserRole);
module.exports = router;