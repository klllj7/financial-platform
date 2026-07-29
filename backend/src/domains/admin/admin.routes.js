const express = require("express");
const adminController = require("./admin.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");
const { authorize } = require("../../common/middlewares/roleMiddleware");

const router = express.Router();

// 관리자 - 전체 사용자 목록 조회
// 일단 로그인 토큰만 있으면 접근 가능하게 만들고,
// 다음 단계에서 ADMIN 권한 체크를 추가할 예정
router.get("/users", authenticate, authorize("ADMIN"), adminController.getUsers);

// 관리자 - 권한 목록 조회
router.get("/roles", authenticate, authorize("ADMIN"), adminController.getRoles);

// 관리자 - 부서 목록 조회
router.get("/departments", authenticate, authorize("ADMIN"), adminController.getDepartments);

// 관리자 - 사용자 권한 변경
router.patch("/users/:userId/role", authenticate, authorize("ADMIN"), adminController.updateUserRole);

// 관리자 - 사용자 상태 변경
router.patch("/users/:userId/status", authenticate, authorize("ADMIN"), adminController.updateUserStatus);

module.exports = router;