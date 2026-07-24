const Notice = require("./notice.model");
const { User, Department } = require("../auth/auth.models");

const createServiceError = (code, message, statusCode) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

/* 고정 공지를 먼저, 같은 그룹에서는 최신 공지를 먼저 반환한다. */
const getNotices = async () => Notice.findAll({
  order: [["isPinned", "DESC"], ["createdAt", "DESC"]],
});

/* JWT 사용자 ID를 기준으로 작성자 이름과 부서를 서버에서 결정한다. */
const createNotice = async ({ userId, payload }) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Department, as: "department", attributes: ["name"] }],
  });

  if (!user) {
    throw createServiceError("NOTICE_AUTHOR_NOT_FOUND", "작성자 정보를 찾을 수 없습니다.", 404);
  }

  return Notice.create({
    ...payload,
    authorId: user.id,
    authorName: user.name,
    departmentName: user.department?.name || null,
  });
};

const updateNotice = async ({ noticeId, payload }) => {
  const notice = await Notice.findByPk(noticeId);
  if (!notice) {
    throw createServiceError("NOTICE_NOT_FOUND", "공지사항을 찾을 수 없습니다.", 404);
  }
  return notice.update(payload);
};

const deleteNotice = async (noticeId) => {
  const notice = await Notice.findByPk(noticeId);
  if (!notice) {
    throw createServiceError("NOTICE_NOT_FOUND", "공지사항을 찾을 수 없습니다.", 404);
  }
  await notice.destroy();
  return { id: Number(noticeId) };
};

module.exports = { getNotices, createNotice, updateNotice, deleteNotice };
