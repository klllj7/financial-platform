// Python(FastAPI) DLP 서비스의 backend/src/domains/dlp/init_db.py가 이미 만든
// usage_log 테이블을 읽기 전용으로 매핑한다.
// 주의: 이 테이블은 sequelize-cli 마이그레이션 대상이 아니다.
// 마이그레이션을 생성하면 테이블을 중복 생성하려다 충돌한다.
const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

const UsageLog = sequelize.define("UsageLog", {
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  // 원문. 컴플라이언스 담당자의 오탐 판단/증빙자료용으로 보관되는 값이라
  // 리포트 생성 로직에서는 절대 이 필드를 그대로 노출하면 안 된다.
  description: { type: DataTypes.STRING },
  // 화면·리포트에 노출할 마스킹본. 탐지 없으면 원문과 동일.
  masked_description: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: "usage_log",
  underscored: true,
  timestamps: true,
  updatedAt: false, // usage_log 테이블에는 updated_at 컬럼이 없음
});

module.exports = UsageLog;
