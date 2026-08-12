const service = require("./ai-tool-application.service");
const { listAvailableBedrockModels } = require("./bedrock-catalog.service");
const { success, fail } = require("../../common/utils/response");

const getApplications = async (req, res) => {
  try {
    return success(res, await service.getApplications({ userId: req.user.userId, roleCode: req.user.roleCode }));
  } catch (error) { return fail(res, "AI_TOOL_LIST_FAILED", error.message, 500); }
};

/* 임직원이 신청 시 선택할 수 있는 Bedrock 서버리스 모델 목록을 제공한다. */
const getBedrockModelCatalog = async (req, res) => {
  try {
    return success(res, await listAvailableBedrockModels());
  } catch (error) {
    return fail(res, "AI_TOOL_BEDROCK_CATALOG_FAILED", error.message, 502);
  }
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
    const bedrockModelId = typeof req.body.bedrockModelId === "string" ? req.body.bedrockModelId.trim() : "";
    const bedrockModelName = typeof req.body.bedrockModelName === "string" ? req.body.bedrockModelName.trim() : "";
    const provider = typeof req.body.provider === "string" ? req.body.provider.trim() : "";
    const purpose = typeof req.body.purpose === "string" ? req.body.purpose.trim() : "";

    if (!bedrockModelId || !bedrockModelName || !provider || !purpose) {
      return fail(res, "AI_TOOL_INVALID_INPUT", "신청할 모델과 사용 목적을 모두 입력해 주세요.", 400);
    }

    return success(res, await service.createApplication({
      userId: req.user.userId,
      payload: { bedrockModelId, bedrockModelName, provider, purpose },
    }), 201);
  } catch (error) {
    return fail(res, error.code || "AI_TOOL_CREATE_FAILED", error.message, error.statusCode || 500);
  }
};

const createManagedTool = async (req, res) => {
  try {
    const bedrockModelId = typeof req.body.bedrockModelId === "string" ? req.body.bedrockModelId.trim() : "";
    const bedrockModelName = typeof req.body.bedrockModelName === "string" ? req.body.bedrockModelName.trim() : "";
    const provider = typeof req.body.provider === "string" ? req.body.provider.trim() : "";
    const purpose = typeof req.body.purpose === "string" ? req.body.purpose.trim() : "";

    if (!bedrockModelId || !bedrockModelName || !provider || !purpose) {
      return fail(
        res,
        "AI_TOOL_INVALID_INPUT",
        "등록할 모델과 설명을 모두 입력해 주세요.",
        400,
      );
    }

    return success(res, await service.createManagedTool({
      adminId: req.user.userId,
      payload: { bedrockModelId, bedrockModelName, provider, purpose },
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
  getBedrockModelCatalog,
  getAllApplications,
  getAvailableTools,
  createApplication,
  createManagedTool,
  reviewApplication,
  updateActiveStatus,
  deleteApplication,
};
