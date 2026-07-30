const express = require("express");
const evidenceController = require("./evidence.controller");
const { authenticate } = require("../../../common/middlewares/authMiddleware");
const { authorize } = require("../../../common/middlewares/roleMiddleware");
const upload = require("./evidenceUpload.middleware");

const router = express.Router();

router.get(
  "/summary",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.getEvidenceSummary,
);
router.get(
    "/checklist",
    authenticate, 
    authorize("COMPLIANCE_MANAGER"),
    evidenceController.getEvidenceChecklist
);
router.patch(
  "/:itemNo/result",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.updateItemResult
);

router.post(
  "/:itemNo/generate",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.generateEvidenceItem,
);

router.post(
  "/:itemNo/upload",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  upload.single("file"),
  evidenceController.uploadEvidenceItem,
);
module.exports = router;
