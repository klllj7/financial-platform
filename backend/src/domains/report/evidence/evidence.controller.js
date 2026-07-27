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

module.exports = { getEvidenceChecklist, updateItemResult };

