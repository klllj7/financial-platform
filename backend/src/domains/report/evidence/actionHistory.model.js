// Python DLP 서비스가 만든 action_history 테이블 읽기 전용 매핑.
// 주의: sequelize-cli 마이그레이션 생성 금지 (usageLog.model.js와 동일 이유).
const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

const ActionHistory = sequelize.define("ActionHistory", {
  event_id: { type: DataTypes.INTEGER, allowNull: false }, // FK -> usage_log.id
  actor_user_id: { type: DataTypes.INTEGER, allowNull: true },
  // 자동 처리: blocked/masked/allowed, 수동 검토: reviewed/escalated/dismissed
  action_type: { type: DataTypes.STRING },
  action_reason: { type: DataTypes.STRING },
  // 컬럼명이 created_at이 아니라 action_time이라 명시적 필드로 정의한다
  // (updated_at 컬럼 자체가 없어 기본 timestamps 매커니즘을 쓰지 않음).
  action_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: "action_history",
  underscored: true,
  timestamps: false,
});

module.exports = ActionHistory;
