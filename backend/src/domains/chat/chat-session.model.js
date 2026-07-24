const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

/* AI 사용하기 화면의 이전 채팅 제목과 핀 고정 상태를 저장한다. */
const ChatSession = sequelize.define("ChatSession", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  isPinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: "chat_sessions", underscored: true });

module.exports = ChatSession;
