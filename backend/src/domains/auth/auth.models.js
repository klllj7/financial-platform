const User = require("./user.model");
const Role = require("./role.model");
const Department = require("./department.model");

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

module.exports = {
  User,
  Role,
  Department,
};