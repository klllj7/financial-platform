const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

// 생성될 때마다 계산 결과 전체를 snapshot(JSONB)으로 얼려서 저장한다.
// 이후 원본 이벤트 데이터가 바뀌어도 이미 생성된 버전의 내용은 그대로 유지된다.
const InternalReport = sequelize.define("InternalReport", {
  document_number: { type: DataTypes.STRING, allowNull: false },
  department_filter: { type: DataTypes.STRING, allowNull: false },
  period_start: { type: DataTypes.DATEONLY, allowNull: false },
  period_end: { type: DataTypes.DATEONLY, allowNull: false },
  risk_threshold: { type: DataTypes.STRING, allowNull: false },
  report_type: { type: DataTypes.STRING, allowNull: false },
  generated_by: { type: DataTypes.INTEGER, allowNull: true },
  generated_by_name: { type: DataTypes.STRING, allowNull: true },
  generated_by_department: { type: DataTypes.STRING, allowNull: true },
  snapshot: { type: DataTypes.JSONB, allowNull: false },
}, {
  tableName: "internal_report",
  underscored: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
});

module.exports = InternalReport;
