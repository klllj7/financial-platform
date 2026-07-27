const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

// 로그인 이력 테이블
// 사용자가 로그인할 때마다 로그인 시각, IP, 성공 여부 등을 저장한다.
const LoginHistory = sequelize.define(
  "LoginHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 로그인 성공 여부
    // 성공 로그인은 SUCCESS, 실패 로그인은 FAIL로 저장할 예정
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "SUCCESS",
    },

    // 로그인 요청 IP 주소
    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // 브라우저, OS 등 접속 환경 정보
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // 로그인 실패 시 실패 사유 저장
    failReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    // 실제 로그인 시각
    loggedInAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "login_histories",
    underscored: true,
  }
);

module.exports = LoginHistory;