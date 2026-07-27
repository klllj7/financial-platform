const express = require("express");
const noticeController = require("./notice.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");
const { authorize } = require("../../common/middlewares/roleMiddleware");

const router = express.Router();

// 공지 조회는 로그인한 임직원·컴플라이언스 담당자·관리자 모두 가능하다.
router.get("/", authenticate, noticeController.getNotices);

/* 공지 등록·수정·삭제는 컴플라이언스 담당자와 관리자에게 허용한다. */
router.post("/", authenticate, authorize("COMPLIANCE_MANAGER", "ADMIN"), noticeController.createNotice);
router.put("/:noticeId", authenticate, authorize("COMPLIANCE_MANAGER", "ADMIN"), noticeController.updateNotice);
router.delete("/:noticeId", authenticate, authorize("COMPLIANCE_MANAGER", "ADMIN"), noticeController.deleteNotice);

module.exports = router;
