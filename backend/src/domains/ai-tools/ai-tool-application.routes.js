const express = require("express");
const controller = require("./ai-tool-application.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");
const { authorize } = require("../../common/middlewares/roleMiddleware");

const router = express.Router();

router.get("/", authenticate, controller.getApplications);
router.post("/", authenticate, controller.createApplication);

/* AI Tool 신청 승인·반려는 관리자만 가능하다. */
router.patch(
  "/:applicationId/review",
  authenticate,
  authorize("ADMIN"),
  controller.reviewApplication,
);

module.exports = router;
