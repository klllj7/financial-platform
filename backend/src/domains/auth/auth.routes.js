const express = require("express");
const authController = require("./auth.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");

const router = express.Router();

// 회원가입
router.post("/signup", authController.signup);

// 로그인
router.post("/login", authController.login);

// 내 정보 조회
// 토큰이 있어야 접근 가능
router.get("/me", authenticate, authController.getMe);

module.exports = router;