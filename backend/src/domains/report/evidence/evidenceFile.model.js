const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

const EvidenceFile = sequelize.define("EvidenceFile", {
  department_id: { type: DataTypes.INTEGER, allowNull: false },
  uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
  target_year: { type: DataTypes.INTEGER },
  category_tag: { type: DataTypes.STRING },
  item_no: { type: DataTypes.STRING },
  item_title: { type: DataTypes.STRING },
  item_result: { type: DataTypes.STRING },
  file_name: { type: DataTypes.STRING },
  file_type: { type: DataTypes.STRING },
  file_path: { type: DataTypes.STRING },
  source_type: { type: DataTypes.STRING },
  draft_content: { type: DataTypes.TEXT },
  is_edited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  edited_content: { type: DataTypes.TEXT },
  secondary_file_name: { type: DataTypes.STRING },
  secondary_file_type: { type: DataTypes.STRING },
  secondary_file_path: { type: DataTypes.STRING },
  // Tier B(초안생성) 항목의 수동 등록 기록(모델 해시검증/데이터 이상치/모델 변경이력 등)을 담는다.
  // 항목별로 별도 테이블을 두지 않고, 해당 item_no의 evidence_file 행에 구조화된 배열로만 저장한다.
  log_entries: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
}, {
  tableName: "evidence_file",
  underscored: true,
});

module.exports = EvidenceFile;
