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

// 관리자 - 사용자 권한 변경
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleCode } = req.body;

    if (!roleCode) {
      return fail(
        res,
        "ADMIN_ROLE_CODE_REQUIRED",
        "변경할 권한을 선택해주세요.",
        400
      );
    }

    const updatedUser = await adminService.updateUserRole(userId, roleCode);

    return success(res, updatedUser, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "ADMIN_UPDATE_ROLE_FAILED",
      error.message || "사용자 권한 변경에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

module.exports = {
  getUsers,
  updateUserRole,
};