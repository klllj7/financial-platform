const express = require("express");
const controller = require("./ai-tool-application.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");
const { authorize } = require("../../common/middlewares/roleMiddleware");

const router = express.Router();

router.get("/", authenticate, controller.getApplications);
router.get("/available", authenticate, controller.getAvailableTools);
router.get(
  "/all",
  authenticate,
  authorize("EMPLOYEE", "COMPLIANCE_MANAGER", "ADMIN"),
  controller.getAllApplications,
);
router.post("/", authenticate, controller.createApplication);
router.post(
  "/managed",
  authenticate,
  authorize("ADMIN"),
  controller.createManagedTool,
);

/* AI Tool 신청 승인·반려는 관리자만 가능하다. */
router.patch(
  "/:applicationId/review",
  authenticate,
  authorize("ADMIN"),
  controller.reviewApplication,
);
router.patch(
  "/:applicationId/active",
  authenticate,
  authorize("ADMIN"),
  controller.updateActiveStatus,
);
router.delete(
  "/:applicationId",
  authenticate,
  authorize("ADMIN"),
  controller.deleteApplication,
);

module.exports = router;
