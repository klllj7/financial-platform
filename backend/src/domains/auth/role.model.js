const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

// 권한 테이블
// ex: EMPLOYEE, COMPLIANCE, ADMIN
const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 권한 코드
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    // 화면 표시용 권한명
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "roles",
    underscored: true,
  }
);

module.exports = Role;