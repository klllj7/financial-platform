const express = require("express");
const authController = require("./auth.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");

const router = express.Router();

// 회원가입
router.post("/signup", authController.signup);

// 로그인
router.post("/login", authController.login);

// 아이디 찾기
// 이름과 부서 코드로 가입된 이메일을 조회
router.post("/find-email", authController.findEmail);

// 비밀번호 재설정 토큰 요청
router.post("/password-reset/request", authController.requestPasswordReset);

// 새 비밀번호 설정
router.post("/password-reset/confirm", authController.confirmPasswordReset);

// 부서 목록 조회
// 회원가입, 아이디 찾기 화면에서 부서 select option으로 사용
router.get("/departments", authController.getDepartments);

// 내 정보 조회
// 토큰이 있어야 접근 가능
router.get("/me", authenticate, authController.getMe);

module.exports = router;