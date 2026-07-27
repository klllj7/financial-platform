const express = require("express");
const controller = require("./dashboard.controller");
const { authenticate } = require("../../common/middlewares/authMiddleware");
const { authorize } = require("../../common/middlewares/roleMiddleware");
const { fail } = require("../../common/utils/response");

const router = express.Router();
router.use(authenticate);

/* 컴플라이언스 담당자와 관리자는 전사 대시보드를 조회한다. */
router.get(
  "/compliance/trend",
  authorize("COMPLIANCE_MANAGER", "ADMIN"),
  controller.complianceTrend,
);
router.get(
  "/compliance/summary",
  authorize("COMPLIANCE_MANAGER", "ADMIN"),
  controller.complianceSummary,
);

/* 개인 대시보드 API는 임직원 본인에게만 허용한다. */
router.use((req, res, next) => {
  if (req.user.roleCode !== "EMPLOYEE") {
    return fail(res, "DASHBOARD_EMPLOYEE_ONLY", "임직원만 조회할 수 있습니다.", 403);
  }
  return next();
});

router.get("/me/summary", controller.summary);
router.get("/me/trend", controller.trend);
router.get("/me/models", controller.models);
router.get("/me/recent", controller.recent);
router.get("/me/usage", controller.usage);

module.exports = router;
