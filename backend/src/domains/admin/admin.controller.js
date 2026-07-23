const adminService = require("./admin.service");
const { success, fail } = require("../../common/utils/response");

// 관리자 - 전체 사용자 목록 조회
const getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers();

    return success(res, users, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "ADMIN_USERS_FAILED",
      error.message || "사용자 목록 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

module.exports = {
  getUsers,
};