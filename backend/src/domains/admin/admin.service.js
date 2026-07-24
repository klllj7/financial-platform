const { User, Role, Department } = require("../auth/auth.models");

// 관리자 - 전체 사용자 목록 조회
const getUsers = async () => {
  const users = await User.findAll({
    attributes: [
      "id",
      "name",
      "email",
      "status",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "code", "name"],
      },
      {
        model: Role,
        as: "role",
        attributes: ["id", "code", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return users;
};

// 관리자 - 사용자 권한 변경
const updateUserRole = async (userId, roleCode) => {
  // 변경하려는 사용자가 존재하는지 확인
  const user = await User.findByPk(userId);

  if(!user) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.statusCode = 404;
    error.code = "ADMIN_USER_NOT_FOUND";
    throw error;
  }

  // 변경하려는 권한이 존재하는지 확인
  const role = await Role.findOne({
    where: { code: roleCode },
  });

  if (!role) {
    const error = new Error("존재하지 않는 권한입니다.");
    error.statusCode = 400;
    error.code = "ADMIN_ROLE_NOT_FOUND";
    throw error;
  }

  // 사용자 권한 변경
  user.roleId = role.id;
  await user.save();

  // 변경된 사용자 정보를 다시 조회해서 반환
  const updatedUser = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "status", "createdAt", "updatedAt"],
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "code", "name"],
      },
      {
        model: Role,
        as: "role",
        attributes: ["id", "code", "name"],
      },
    ],
  });

  return updatedUser;
};

module.exports = {
  getUsers,
  updateUserRole,
};