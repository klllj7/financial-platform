const evidenceService = require("./evidence.service");
const { success, fail } = require("../../../common/utils/response");

const getEvidenceChecklist = async (req, res) => {
  try {
    const { departmentId, targetYear } = req.query;

    if (!departmentId || !targetYear) {
      return fail(
        res,
        "EVIDENCE_PARAMS_REQUIRED",
        "departmentId와 targetYear는 필수입니다.",
        400
      );
    }

    const data = await evidenceService.getEvidenceChecklist({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
    });

    return success(res, data, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "EVIDENCE_CHECKLIST_FAILED",
      error.message || "증빙자료 조회에 실패했습니다",
      error.statusCode || 500
    );
  }
};
const updateItemResult = async (req, res) => {
  try {
    const { itemNo } = req.params;
    const { departmentId, targetYear, result } = req.body;

    if (!departmentId || !targetYear || !result) {
      return fail(res, "EVIDENCE_RESULT_PARAMS_REQUIRED", "departmentId, targetYear, result은 필수입니다.", 400);
    }

    const data = await evidenceService.updateItemResult({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
      itemNo,
      result,
    });

    return success(res, data, 200);
  } catch (error) {
    return fail(res, error.code || "EVIDENCE_RESULT_UPDATE_FAILED", error.message || "결과 저장에 실패했습니다", error.statusCode || 500);
  }
};

const getEvidenceSummary = async (req, res) => {
  try {
    const targetYear = Number(req.query.targetYear) || new Date().getFullYear();
    return success(
      res,
      await evidenceService.getEvidenceSummary({ targetYear }),
      200,
    );
  } catch (error) {
    return fail(
      res,
      error.code || "EVIDENCE_SUMMARY_FAILED",
      error.message || "증빙자료 요약 조회에 실패했습니다.",
      error.statusCode || 500,
    );
  }
};
const generateEvidenceItem = async (req, res) => {
  try {
    const { itemNo } = req.params;
    const { departmentId, targetYear, from, to } = req.body;

    if (!departmentId || !targetYear) {
      return fail(res, "EVIDENCE_GENERATE_PARAMS_REQUIRED", "departmentId와 targetYear는 필수입니다.", 400);
    }

    const data = await evidenceService.generateEvidenceItem({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
      itemNo, // item_no는 STRING 컬럼이라 Number 캐스팅하지 않는다
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });

    return success(res, data, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "EVIDENCE_GENERATE_FAILED",
      error.message || "증빙자료 생성에 실패했습니다",
      error.statusCode || 500
    );
  }
};
const uploadEvidenceItem = async (req, res) => {
  try {
    const { itemNo } = req.params;
    const { departmentId, targetYear } = req.body;

    if (!departmentId || !targetYear) {
      return fail(res, "EVIDENCE_UPLOAD_PARAMS_REQUIRED", "departmentId와 targetYear는 필수입니다.", 400);
    }
    if (!req.file) {
      return fail(res, "EVIDENCE_UPLOAD_FILE_REQUIRED", "업로드할 파일이 없습니다.", 400);
    }

    const data = await evidenceService.uploadEvidenceItem({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
      itemNo,
      file: req.file,
    });

    return success(res, data, 200);
  } catch (error) {
    return fail(res, error.code || "EVIDENCE_UPLOAD_FAILED", error.message || "증빙파일 업로드에 실패했습니다", error.statusCode || 500);
  }
};

const exportChecklistXlsx = async (req, res) => {
  try {
    const { departmentId, targetYear } = req.query;
    if (!departmentId || !targetYear) {
      return fail(res, "EVIDENCE_EXPORT_PARAMS_REQUIRED", "departmentId와 targetYear는 필수입니다.", 400);
    }

    const { fileName, buffer } = await evidenceService.exportChecklistXlsx({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    return res.send(buffer);
  } catch (error) {
    return fail(
      res,
      error.code || "EVIDENCE_EXPORT_CHECKLIST_FAILED",
      error.message || "체크리스트 내보내기에 실패했습니다.",
      error.statusCode || 500,
    );
  }
};

const exportEvidenceZip = async (req, res) => {
  try {
    const { departmentId, targetYear } = req.query;
    if (!departmentId || !targetYear) {
      return fail(res, "EVIDENCE_EXPORT_PARAMS_REQUIRED", "departmentId와 targetYear는 필수입니다.", 400);
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(`증빙자료_${targetYear}.zip`)}"`);

    await evidenceService.exportEvidenceZip({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
      res,
    });
  } catch (error) {
    if (!res.headersSent) {
      return fail(
        res,
        error.code || "EVIDENCE_EXPORT_ZIP_FAILED",
        error.message || "증빙파일 압축 다운로드에 실패했습니다.",
        error.statusCode || 500,
      );
    }
    res.end();
  }
};

const addLogEntry = async (req, res) => {
  try {
    const { itemNo } = req.params;
    const { departmentId, targetYear, entry } = req.body;

    if (!departmentId || !targetYear || !entry) {
      return fail(res, "EVIDENCE_LOG_PARAMS_REQUIRED", "departmentId, targetYear, entry는 필수입니다.", 400);
    }

    const entries = await evidenceService.appendLogEntry({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
      itemNo,
      entry,
      recordedBy: req.user?.userId ?? null,
    });

    return success(res, { itemNo, entries }, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "EVIDENCE_LOG_ADD_FAILED",
      error.message || "기록 등록에 실패했습니다.",
      error.statusCode || 500,
    );
  }
};

const confirmDraft = async (req, res) => {
  try {
    const { itemNo } = req.params;
    const { departmentId, targetYear, draftContent, editedContent, stats, isEdited } = req.body;

    if (!departmentId || !targetYear || !editedContent || !stats) {
      return fail(
        res,
        "EVIDENCE_DRAFT_PARAMS_REQUIRED",
        "departmentId, targetYear, editedContent, stats는 필수입니다.",
        400,
      );
    }

    const data = await evidenceService.confirmDraft({
      departmentId: Number(departmentId),
      targetYear: Number(targetYear),
      itemNo,
      draftContent: draftContent ?? editedContent,
      editedContent,
      stats,
      isEdited: Boolean(isEdited),
    });

    return success(res, data, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "EVIDENCE_DRAFT_CONFIRM_FAILED",
      error.message || "초안 확정에 실패했습니다.",
      error.statusCode || 500,
    );
  }
};

module.exports = {
  getEvidenceChecklist,
  updateItemResult,
  getEvidenceSummary,
  generateEvidenceItem,
  uploadEvidenceItem,
  exportChecklistXlsx,
  exportEvidenceZip,
  addLogEntry,
  confirmDraft,
};
