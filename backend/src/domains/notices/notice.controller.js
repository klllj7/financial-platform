const noticeService = require("./notice.service");
const { success, fail } = require("../../common/utils/response");

const validateNoticePayload = (body) => {
  if (typeof body.title !== "string" || body.title.trim() === "") return "제목을 입력해 주세요.";
  if (typeof body.content !== "string" || body.content.trim() === "") return "내용을 입력해 주세요.";
  if (body.title.trim().length > 200) return "제목은 200자 이하로 입력해 주세요.";
  return null;
};

const getNotices = async (req, res) => {
  try {
    return success(res, await noticeService.getNotices());
  } catch (error) {
    return fail(res, "NOTICE_LIST_FAILED", error.message, 500);
  }
};

const createNotice = async (req, res) => {
  try {
    const validationMessage = validateNoticePayload(req.body);
    if (validationMessage) return fail(res, "NOTICE_INVALID_INPUT", validationMessage, 400);

    const notice = await noticeService.createNotice({
      userId: req.user.userId,
      payload: {
        category: req.body.category?.trim() || "일반",
        title: req.body.title.trim(),
        content: req.body.content.trim(),
        isPinned: Boolean(req.body.isPinned),
      },
    });
    return success(res, notice, 201);
  } catch (error) {
    return fail(res, error.code || "NOTICE_CREATE_FAILED", error.message, error.statusCode || 500);
  }
};

const updateNotice = async (req, res) => {
  try {
    const validationMessage = validateNoticePayload(req.body);
    if (validationMessage) return fail(res, "NOTICE_INVALID_INPUT", validationMessage, 400);

    const notice = await noticeService.updateNotice({
      noticeId: req.params.noticeId,
      payload: {
        category: req.body.category?.trim() || "일반",
        title: req.body.title.trim(),
        content: req.body.content.trim(),
        isPinned: Boolean(req.body.isPinned),
      },
    });
    return success(res, notice);
  } catch (error) {
    return fail(res, error.code || "NOTICE_UPDATE_FAILED", error.message, error.statusCode || 500);
  }
};

const deleteNotice = async (req, res) => {
  try {
    return success(res, await noticeService.deleteNotice(req.params.noticeId));
  } catch (error) {
    return fail(res, error.code || "NOTICE_DELETE_FAILED", error.message, error.statusCode || 500);
  }
};

module.exports = { getNotices, createNotice, updateNotice, deleteNotice };
