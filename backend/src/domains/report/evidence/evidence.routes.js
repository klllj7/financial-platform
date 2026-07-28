const express = require("express");
const evidenceController = require("./evidence.controller");
// const {authenticate, requireRole} = require("../../../common/middlewares/authMiddleware");
const { authenticate } = require("../../../common/middlewares/authMiddleware");


const router = express.Router();

router.get(
    "/checklist",
    authenticate, 
    // requireRole("COMPLIANCE_MANAGER", "ADMIN"),
    evidenceController.getEvidenceChecklist
);
router.patch(
  "/:itemNo/result",
  authenticate,
  evidenceController.updateItemResult
);


module.exports = router;