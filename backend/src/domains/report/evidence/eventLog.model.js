// Python DLP 서비스가 만든 event_log 테이블 읽기 전용 매핑.
// 주의: sequelize-cli 마이그레이션 생성 금지 (usageLog.model.js와 동일 이유).
const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

const EventLog = sequelize.define("EventLog", {
  event_id: { type: DataTypes.INTEGER, allowNull: false }, // FK -> usage_log.id
  // 콤마로 여러 유형이 합쳐진 문자열(예: "phone_number,email").
  // 집계 시 반드시 split 후 재그룹해야 한다.
  detection_type: { type: DataTypes.STRING },
  masked_yn: { type: DataTypes.BOOLEAN, defaultValue: false },
  grade: { type: DataTypes.STRING }, // "HIGH" / "MEDIUM" / "LOW"
  similarity_score: { type: DataTypes.FLOAT, allowNull: true },
}, {
  tableName: "event_log",
  underscored: true,
  timestamps: true,
  updatedAt: false, // event_log 테이블에는 updated_at 컬럼이 없음
});

module.exports = EventLog;
