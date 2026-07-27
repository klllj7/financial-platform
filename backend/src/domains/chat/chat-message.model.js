const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");
const ChatSession = require("./chat-session.model");

/* 각 채팅방의 사용자 질문과 AI 답변을 시간순으로 저장한다. */
const ChatMessage = sequelize.define("ChatMessage", {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  sessionId: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.ENUM("USER", "ASSISTANT"), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  blocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  maskApplied: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  modelName: { type: DataTypes.STRING(100), allowNull: true },
  // Claude 응답 usage를 저장해 실제 토큰 통계에 사용한다.
  inputTokens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  outputTokens: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: "chat_messages", underscored: true });

ChatSession.hasMany(ChatMessage, { foreignKey: "sessionId", as: "messages", onDelete: "CASCADE" });
ChatMessage.belongsTo(ChatSession, { foreignKey: "sessionId", as: "session" });

module.exports = ChatMessage;
