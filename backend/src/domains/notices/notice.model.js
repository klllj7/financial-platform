const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

/* 임직원에게 노출할 공지사항 본문과 작성자 정보를 저장한다. */
const Notice = sequelize.define("Notice", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  category: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "일반" },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  authorId: { type: DataTypes.INTEGER, allowNull: false },
  authorName: { type: DataTypes.STRING(100), allowNull: false },
  departmentName: { type: DataTypes.STRING(100), allowNull: true },
  isPinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: "notices",
  underscored: true,
});

module.exports = Notice;
