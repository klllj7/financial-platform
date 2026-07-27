const {DataTypes} = require("sequelize");
const sequelize = require("../../../common/config/db");

const PolicyInfo = sequelize.define("PolicyInfo", {
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rule_content: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  active_yn: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  approval_status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending", // 승인 상태: pending, approved, rejected
  },
  reject_reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  requested_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reject_detail: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  revision_request: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  rejected_by: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rejected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  tableName: "policy_info",
  underscored: true,
});
module.exports = PolicyInfo;