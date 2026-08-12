const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

/* AI 사용하기 화면의 이전 채팅 제목과 핀 고정 상태를 저장한다. */
const ChatSession = sequelize.define("ChatSession", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  isPinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  deletedAt: { type: DataTypes.DATE, allowNull: true },
  // 세션 생성 시점에 고른 AI Tool을 고정해, 같은 대화 안에서 메시지마다
  // 다른 모델이 쓰이지 않도록 한다. DEFAULT_SOLAR 선택 시 toolKey만 채워진다.
  aiToolApplicationId: { type: DataTypes.BIGINT, allowNull: true },
  toolKey: { type: DataTypes.STRING(50), allowNull: true },
}, { tableName: "chat_sessions", underscored: true });

module.exports = ChatSession;
