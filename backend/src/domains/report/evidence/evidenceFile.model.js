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
}, {
  tableName: "evidence_file",
  underscored: true,
});

module.exports = EvidenceFile;
