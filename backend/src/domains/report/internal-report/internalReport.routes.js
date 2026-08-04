const express = require("express");
const internalReportController = require("./internalReport.controller");
const { authenticate } = require("../../../common/middlewares/authMiddleware");
const { authorize } = require("../../../common/middlewares/roleMiddleware");

const router = express.Router();

router.post(
  "/generate",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  internalReportController.generateReport
);

router.get(
  "/",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  internalReportController.listReports
);

router.get(
  "/:id",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  internalReportController.getReportById
);

router.delete(
  "/:id",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  internalReportController.deleteReport
);

module.exports = router;
