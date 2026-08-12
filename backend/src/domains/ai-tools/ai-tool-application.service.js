const AiToolApplication = require("./ai-tool-application.model");
const { User, Department } = require("../auth/auth.models");
const { isModelAvailable } = require("./bedrock-catalog.service");

const serviceError = (code, message, statusCode) => Object.assign(new Error(message), { code, statusCode });

/* 관리자는 전체 신청을 조회하고, 그 외 사용자는 본인 신청만 조회한다. */
const getApplications = ({ userId, roleCode }) => AiToolApplication.findAll({
  where: roleCode === "ADMIN" ? {} : { userId },
  order: [["createdAt", "DESC"]],
});

/* 로그인한 사용자가 조직의 전체 신청 현황을 조회한다. */
const getAllApplications = () => AiToolApplication.findAll({
  attributes: [
    "id",
    "toolName",
    "provider",
    "status",
    "isActive",
    "createdAt",
  ],
  order: [["createdAt", "DESC"]],
});

/* 승인·활성화된 AI Tool의 공개 가능한 정보만 모든 로그인 사용자에게 제공한다. */
const getAvailableTools = () => AiToolApplication.findAll({
  attributes: ["id", "toolName", "provider"],
  where: {
    status: "APPROVED",
    isActive: true,
  },
  order: [["toolName", "ASC"], ["createdAt", "ASC"]],
});

/* 신청자 정보는 요청값을 신뢰하지 않고 로그인 사용자 테이블에서 가져온다. */
const createApplication = async ({ userId, payload }) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Department, as: "department", attributes: ["name"] }],
  });
  if (!user) throw serviceError("AI_TOOL_USER_NOT_FOUND", "신청자 정보를 찾을 수 없습니다.", 404);

  const { bedrockModelId, bedrockModelName, provider, purpose } = payload;

  /* 신청 시점 카탈로그에 실제로 존재하는 서버리스 모델인지 검증한다. */
  const available = await isModelAvailable(bedrockModelId);
  if (!available) {
    throw serviceError(
      "AI_TOOL_MODEL_NOT_AVAILABLE",
      "선택한 모델은 더 이상 신청할 수 없습니다. 목록을 새로고침해 주세요.",
      409,
    );
  }

  const previousApplications = await AiToolApplication.findAll({
    where: { bedrockModelId },
    order: [["createdAt", "DESC"]],
  });
  const duplicate = previousApplications[0];

  if (duplicate?.status === "REJECTED") {
    const reason =
      duplicate.reviewComment?.trim() || "관리자 검토 결과 승인되지 않음";
    throw serviceError(
      "AI_TOOL_REAPPLICATION_BLOCKED",
      `해당 AI는 '${reason}'의 이유로 사용이 중지되었습니다.`,
      409,
    );
  }
  if (duplicate?.status === "PENDING") {
    throw serviceError(
      "AI_TOOL_APPLICATION_PENDING",
      "해당 AI는 이미 신청되어 검토 중입니다.",
      409,
    );
  }
  if (duplicate?.status === "APPROVED") {
    throw serviceError(
      "AI_TOOL_ALREADY_APPROVED",
      "해당 AI는 이미 승인되어 사용할 수 있습니다.",
      409,
    );
  }

  return AiToolApplication.create({
    userId,
    applicantName: user.name,
    departmentName: user.department?.name || null,
    toolName: bedrockModelName,
    provider,
    purpose,
    bedrockModelId,
    bedrockModelName,
    modelSource: "BEDROCK",
  });
};

/* 관리자가 신청 절차 없이 승인·활성 상태의 AI Tool을 직접 등록한다. */
const createManagedTool = async ({ adminId, payload }) => {
  const admin = await User.findByPk(adminId, {
    include: [{ model: Department, as: "department", attributes: ["name"] }],
  });
  if (!admin) throw serviceError("AI_TOOL_ADMIN_NOT_FOUND", "관리자 정보를 찾을 수 없습니다.", 404);

  const duplicate = await AiToolApplication.findOne({
    where: {
      toolName: payload.toolName,
      provider: payload.provider,
      status: "APPROVED",
    },
  });
  if (duplicate) {
    throw serviceError(
      "AI_TOOL_ALREADY_EXISTS",
      "동일한 이름과 공급사의 승인 모델이 이미 존재합니다.",
      409,
    );
  }

  return AiToolApplication.create({
    userId: adminId,
    applicantName: admin.name,
    departmentName: admin.department?.name || null,
    ...payload,
    modelSource: "CUSTOM",
    status: "APPROVED",
    isActive: true,
    reviewerId: adminId,
    reviewComment: "관리자 직접 등록",
    reviewedAt: new Date(),
  });
};

/* 승인과 반려 결과 및 검토 담당자를 함께 기록한다. Bedrock 모델은 IAM 태스크 롤로
   인증되므로 승인 시점에 별도 자격증명 입력·연결 테스트가 필요 없다. */
const reviewApplication = async ({
  applicationId,
  reviewerId,
  status,
  reviewComment,
}) => {
  const application = await AiToolApplication.findByPk(applicationId);
  if (!application) throw serviceError("AI_TOOL_APPLICATION_NOT_FOUND", "신청 내역을 찾을 수 없습니다.", 404);

  const updateValues = {
    status,
    reviewerId,
    reviewComment: reviewComment || null,
    reviewedAt: new Date(),
  };

  if (status === "APPROVED") {
    if (application.modelSource === "BEDROCK") {
      const available = await isModelAvailable(application.bedrockModelId);
      if (!available) {
        throw serviceError(
          "AI_TOOL_MODEL_NOT_AVAILABLE",
          "신청 당시의 모델을 더 이상 카탈로그에서 찾을 수 없습니다. 신청자에게 재신청을 안내해 주세요.",
          409,
        );
      }
    }
    updateValues.isActive = true;
  }

  await application.update(updateValues);
  return AiToolApplication.findByPk(applicationId);
};

/* 승인된 AI Tool의 사용자 노출 여부를 관리자가 변경한다. */
const updateActiveStatus = async ({ applicationId, isActive }) => {
  const application = await AiToolApplication.findByPk(applicationId);
  if (!application) throw serviceError("AI_TOOL_APPLICATION_NOT_FOUND", "신청 내역을 찾을 수 없습니다.", 404);
  if (application.status !== "APPROVED") {
    throw serviceError(
      "AI_TOOL_NOT_APPROVED",
      "승인 완료된 AI Tool만 활성화할 수 있습니다.",
      409,
    );
  }

  return application.update({ isActive });
};

/* 관리자가 AI Tool 신청 또는 직접 등록 모델을 삭제한다. */
const deleteApplication = async (applicationId) => {
  const application = await AiToolApplication.findByPk(applicationId);
  if (!application) throw serviceError("AI_TOOL_APPLICATION_NOT_FOUND", "삭제할 AI Tool을 찾을 수 없습니다.", 404);

  await application.destroy();
  return { id: application.id };
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
