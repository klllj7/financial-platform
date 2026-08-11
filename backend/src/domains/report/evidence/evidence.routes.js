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

router.delete(
  "/:itemNo",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.deleteEvidenceItem,
);

router.post(
  "/:itemNo/log-entries",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.addLogEntry,
);

router.patch(
  "/:itemNo/draft",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.confirmDraft,
);

router.get(
  "/export/checklist.xlsx",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.exportChecklistXlsx,
);

router.get(
  "/export/zip",
  authenticate,
  authorize("COMPLIANCE_MANAGER"),
  evidenceController.exportEvidenceZip,
);

module.exports = router;
