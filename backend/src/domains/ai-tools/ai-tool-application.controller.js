const service = require("./ai-tool-application.service");
const { success, fail } = require("../../common/utils/response");

const getApplications = async (req, res) => {
  try {
    return success(res, await service.getApplications({ userId: req.user.userId, roleCode: req.user.roleCode }));
  } catch (error) { return fail(res, "AI_TOOL_LIST_FAILED", error.message, 500); }
};

const getAllApplications = async (req, res) => {
  try {
    return success(res, await service.getAllApplications());
  } catch (error) {
    return fail(res, "AI_TOOL_ALL_LIST_FAILED", error.message, 500);
  }
};

const getAvailableTools = async (req, res) => {
  try {
    return success(res, await service.getAvailableTools());
  } catch (error) {
    return fail(res, "AI_TOOL_AVAILABLE_LIST_FAILED", error.message, 500);
  }
};

const createApplication = async (req, res) => {
  try {
    const toolName = typeof req.body.toolName === "string" ? req.body.toolName.trim() : "";
    const provider = typeof req.body.provider === "string" ? req.body.provider.trim() : "";
    const purpose = typeof req.body.purpose === "string" ? req.body.purpose.trim() : "";

    if (!toolName || !provider || !purpose) {
      return fail(res, "AI_TOOL_INVALID_INPUT", "Tool 이름, 공급사, 사용 목적을 모두 입력해 주세요.", 400);
    }

    return success(res, await service.createApplication({ userId: req.user.userId, payload: { toolName, provider, purpose } }), 201);
  } catch (error) {
    return fail(res, error.code || "AI_TOOL_CREATE_FAILED", error.message, error.statusCode || 500);
  }
};

const createManagedTool = async (req, res) => {
  try {
    const toolName = typeof req.body.toolName === "string" ? req.body.toolName.trim() : "";
    const provider = typeof req.body.provider === "string" ? req.body.provider.trim() : "";
    const purpose = typeof req.body.purpose === "string" ? req.body.purpose.trim() : "";

    if (!toolName || !provider || !purpose) {
      return fail(
        res,
        "AI_TOOL_INVALID_INPUT",
        "모델 이름, 공급사, 설명을 모두 입력해 주세요.",
        400,
      );
    }

    return success(res, await service.createManagedTool({
      adminId: req.user.userId,
      payload: { toolName, provider, purpose },
    }), 201);
  } catch (error) {
    return fail(
      res,
      error.code || "AI_TOOL_MANAGED_CREATE_FAILED",
      error.message,
      error.statusCode || 500,
    );
  }
};

const reviewApplication = async (req, res) => {
  try {
    const status = String(req.body.status || "").toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return fail(res, "AI_TOOL_REVIEW_STATUS_INVALID", "상태는 APPROVED 또는 REJECTED여야 합니다.", 400);
    }
    if (status === "REJECTED" && !req.body.reviewComment?.trim()) {
      return fail(res, "AI_TOOL_REJECT_REASON_REQUIRED", "반려 사유를 입력해 주세요.", 400);
    }

    return success(res, await service.reviewApplication({
      applicationId: req.params.applicationId,
      reviewerId: req.user.userId,
      status,
      reviewComment: req.body.reviewComment?.trim(),
      connection: status === "APPROVED"
        ? {
          apiKey: req.body.apiKey?.trim(),
          apiBaseUrl: req.body.apiBaseUrl?.trim(),
          apiModelId: req.body.apiModelId?.trim(),
        }
        : null,
    }));
  } catch (error) {
    return fail(res, error.code || "AI_TOOL_REVIEW_FAILED", error.message, error.statusCode || 500);
  }
};

const updateActiveStatus = async (req, res) => {
  try {
    if (typeof req.body.isActive !== "boolean") {
      return fail(
        res,
        "AI_TOOL_ACTIVE_STATUS_REQUIRED",
        "isActive 값은 boolean이어야 합니다.",
        400,
      );
    }

    return success(res, await service.updateActiveStatus({
      applicationId: req.params.applicationId,
      isActive: req.body.isActive,
    }));
  } catch (error) {
    return fail(
      res,
      error.code || "AI_TOOL_ACTIVE_STATUS_FAILED",
      error.message,
      error.statusCode || 500,
    );
  }
};

const deleteApplication = async (req, res) => {
  try {
    return success(
      res,
      await service.deleteApplication(req.params.applicationId),
    );
  } catch (error) {
    return fail(
      res,
      error.code || "AI_TOOL_DELETE_FAILED",
      error.message,
      error.statusCode || 500,
    );
  }
};

module.exports = {
  getApplications,
  getAllApplications,
  getAvailableTools,
  createApplication,
  createManagedTool,
  reviewApplication,
  updateActiveStatus,
  deleteApplication,
};
