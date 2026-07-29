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

// 관리자 - 사용자 상태 변경 Controller
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // status 값이 없으면 요청 실패 처리
    if (!status) {
      return fail(
        res,
        "ADMIN_STATUS_REQUIRED",
        "변경할 계정 상태를 선택해주세요.",
        400
      );
    }

    const updatedUser = await adminService.updateUserStatus(userId, status);

    return success(res, updatedUser, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "ADMIN_UPDATE_STATUS_FAILED",
      error.message || "사용자 상태 변경에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 관리자 - 권한 목록 조회 Controller
const getRoles = async (req, res) => {
  try {
    const roles = await adminService.getRoles();

    return success(res, roles, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "ADMIN_ROLES_FAILED",
      error.message || "권한 목록 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

// 관리자 - 부서 목록 조회 Controller
const getDepartments = async (req,res) => {
  try {
    const departments = await adminService.getDepartments();

    return success(res, departments, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "ADMIN_DEPARTMENTS_FAILED",
      error.message || "부서 목록 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

//  관리자 - 특정 사용자 로그인 이력 조회 Controller
const getUserLoginHistories = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await adminService.getUserLoginHistories(userId);

    return success(res, result, 200);
  } catch (error) {
    return fail(
      res,
      error.code || "ADMIN_LOGIN_HISTORIES_FAILED",
      error.message || "로그인 이력 조회에 실패했습니다.",
      error.statusCode || 500
    );
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  updateUserStatus,
  getRoles,
  getDepartments,
  getUserLoginHistories,
};