const internalReportService = require("./internalReport.service");
const { success, fail } = require("../../../common/utils/response");

const generateReport = async (req, res) => {
  try {
    const { departmentFilter, periodStart, periodEnd, riskThreshold, reportType } = req.body;

    if (!departmentFilter || !periodStart || !periodEnd || !riskThreshold || !reportType) {
      return fail(
        res,
        "INTERNAL_REPORT_GENERATE_PARAMS_REQUIRED",
        "departmentFilter, periodStart, periodEnd, riskThreshold, reportType는 필수입니다.",
        400
      );
    }

    const data = await internalReportService.generateReport({
      departmentFilter,
      periodStart,
      periodEnd,
      riskThreshold,
      reportType,
      userId: req.user?.userId ?? null,
    });

    return success(res, data, 201);
  } catch (error) {
    return fail(
      res,
      error.code || "INTERNAL_REPORT_GENERATE_FAILED",
      error.message || "내부결재 보고서 생성에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

const listReports = async (req, res) => {
  try {
    const data = await internalReportService.listReports();
    return success(res, data, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "INTERNAL_REPORT_LIST_FAILED",
      error.message || "내부결재 보고서 목록 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await internalReportService.getReportById(id);

    if (!data) {
      return fail(res, "INTERNAL_REPORT_NOT_FOUND", "해당 보고서를 찾을 수 없습니다.", 404);
    }

    return success(res, data, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "INTERNAL_REPORT_GET_FAILED",
      error.message || "내부결재 보고서 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await internalReportService.deleteReport(id);

    if (!deleted) {
      return fail(res, "INTERNAL_REPORT_NOT_FOUND", "해당 보고서를 찾을 수 없습니다.", 404);
    }

    return success(res, { id: Number(id) }, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "INTERNAL_REPORT_DELETE_FAILED",
      error.message || "내부결재 보고서 삭제에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

module.exports = {
  generateReport,
  listReports,
  getReportById,
  deleteReport,
};
