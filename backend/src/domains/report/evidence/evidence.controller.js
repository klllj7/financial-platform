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

module.exports = {
  getEvidenceChecklist,
  updateItemResult,
  getEvidenceSummary,
  generateEvidenceItem, 
  uploadEvidenceItem,
};
