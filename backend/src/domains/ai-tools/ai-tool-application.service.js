const AiToolApplication = require("./ai-tool-application.model");
const { User, Department } = require("../auth/auth.models");

const serviceError = (code, message, statusCode) => Object.assign(new Error(message), { code, statusCode });

/* 컴플라이언스 담당자와 관리자는 전체 신청, 임직원은 본인 신청만 조회한다. */
const getApplications = ({ userId, roleCode }) => AiToolApplication.findAll({
  where: ["COMPLIANCE_MANAGER", "ADMIN"].includes(roleCode) ? {} : { userId },
  order: [["createdAt", "DESC"]],
});

/* 신청자 정보는 요청값을 신뢰하지 않고 로그인 사용자 테이블에서 가져온다. */
const createApplication = async ({ userId, payload }) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Department, as: "department", attributes: ["name"] }],
  });
  if (!user) throw serviceError("AI_TOOL_USER_NOT_FOUND", "신청자 정보를 찾을 수 없습니다.", 404);

  return AiToolApplication.create({
    userId,
    applicantName: user.name,
    departmentName: user.department?.name || null,
    ...payload,
  });
};

/* 승인과 반려 결과 및 검토 담당자를 함께 기록한다. */
const reviewApplication = async ({ applicationId, reviewerId, status, reviewComment }) => {
  const application = await AiToolApplication.findByPk(applicationId);
  if (!application) throw serviceError("AI_TOOL_APPLICATION_NOT_FOUND", "신청 내역을 찾을 수 없습니다.", 404);

  return application.update({
    status,
    reviewerId,
    reviewComment: reviewComment || null,
    reviewedAt: new Date(),
  });
};

module.exports = { getApplications, createApplication, reviewApplication };
