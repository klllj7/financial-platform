const User = require("./user.model");
const Role = require("./role.model");
const Department = require("./department.model");
const LoginHistory = require("./loginHistory.model");
const UserAgreement = require("./userAgreement.model");

// User N : 1 Department
// 한 부서에 여러 사용자가 소속
User.belongsTo(Department, {
  foreignKey: {
    name: "departmentId",
    allowNull: false,
  },
  as: "department",
});

Department.hasMany(User, {
  foreignKey: "departmentId",
  as: "users",
});

// User N : 1 Role
// 사용자 한명 당 하나의 역할 가짐
User.belongsTo(Role, {
  foreignKey: {
    name: "roleId",
    allowNull: false,
  },
  as: "role",
});

Role.hasMany(User, {
  foreignKey: "roleId",
  as: "users",
});

// User 1 : N LoginHistory
// 한 사용자는 여러 번 로그인할 수 있으므로 로그인 이력을 여러 개 가짐
User.hasMany(LoginHistory, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "loginHistories",
});

LoginHistory.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "user",
});

// User 1 : N UserAgreement
// 한 사용자는 이용약관, 개인정보 수집·이용 등 여러 동의 이력을 가질 수 있다.
User.hasMany(UserAgreement, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "agreements",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

UserAgreement.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

module.exports = {
  User,
  Role,
  Department,
  LoginHistory,
  UserAgreement,
};