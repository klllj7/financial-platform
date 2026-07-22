const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

// 사용자 테이블
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 사용자 이름
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // 로그인 ID로 사용할 이메일
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    // 암호화된 비밀번호 저장
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    // 계정 상태
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "users",
    underscored: true,
  }
);

module.exports = User;