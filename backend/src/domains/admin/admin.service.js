const { User, Role, Department, LoginHistory } = require("../auth/auth.models");

// 관리자 - 권한 목록 조회
const getRoles = async () => {
  const roles = await Role.findAll({
    attributes: ["id", "code", "name"],
    order: [["id", "ASC"]],
  });

  return roles;
};

// 관리자 - 부서 목록 조회
const getDepartments = async () => {
  const departments = await Department.findAll({
    attributes: ["id", "code", "name"],
    order: [["id", "ASC"]],
  });

  return departments;
};

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

  /* 
    각 사용자별 가장 최근 로그인 이력 조회
    현재는 사용자 목록을 가져온 뒤 사용자마다 최근 로그인 1건을 조회하는 방식으로 구현
    나중에 데이터가 많아지면 JOIN 또는 서브쿼리 방식으로 최적화 가능
  */
  const usersWithLastLogin = await Promise.all(
    users.map(async (user) => {
      const lastLoginHistory = await LoginHistory.findOne({
        where: {
          userId: user.id,
          status: "SUCCESS",
        },
        order: [["loggedInAt", "DESC"]],
      });

      // Sequelize 객체를 일반 객체로 변환
      const plainUser = user.get({ plain: true });

      return {
        ...plainUser,

        // 관리자 계정 관리 화면에서 사용할 최근 로그인 시간
        lastLoginAt: lastLoginHistory
          ? lastLoginHistory.loggedInAt
          : null,
      };
    })
  );

  return usersWithLastLogin;
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

// 관리자 - 사용자 상태 변경
const updateUserStatus = async (userId, status) => {
  /*
    허용할 계정 상태값을 미리 제한한다.
    잘못된 값이 들어오면 DB에 저장하지 않고 에러를 발생시킨다.
  */
  const allowedStatuses = ["ACTIVE", "INACTIVE"];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("올바르지 않은 계정 상태입니다.");
    error.statusCode = 400;
    error.code = "ADMIN_INVALID_USER_STATUS";
    throw error;
  }

  // 상태를 변경하려는 사용자가 존재하는지 확인
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("사용자를 찾을 수 없습니다.");
    error.statusCode = 404;
    error.code = "ADMIN_USER_NOT_FOUND";
    throw error;
  }

  // 사용자 상태 변경
  user.status = status;
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
  updateUserStatus,
  getRoles,
  getDepartments,
};