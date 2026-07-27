const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

/* 임직원의 AI Tool 사용 신청과 컴플라이언스 검토 결과를 저장한다. */
const AiToolApplication = sequelize.define("AiToolApplication", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  applicantName: { type: DataTypes.STRING(100), allowNull: false },
  departmentName: { type: DataTypes.STRING(100), allowNull: true },
  toolName: { type: DataTypes.STRING(150), allowNull: false },
  provider: { type: DataTypes.STRING(100), allowNull: false },
  purpose: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM("PENDING", "APPROVED", "REJECTED"), allowNull: false, defaultValue: "PENDING" },
  reviewerId: { type: DataTypes.INTEGER, allowNull: true },
  reviewComment: { type: DataTypes.TEXT, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: "ai_tool_applications", underscored: true });

module.exports = AiToolApplication;
