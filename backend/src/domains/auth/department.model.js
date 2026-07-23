const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

// 부서 테이블
// ex: 여신심사팀, 마케팅팀, IT보안팀, 준법감시팀
const Department = sequelize.define(
  "Department",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 부서 코드
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    // 부서명
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    tableName: "department",
    underscored: true,
  }
);

module.exports = Department;