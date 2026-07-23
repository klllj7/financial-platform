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

module.exports = {
  getUsers,
};