const {DataTypes} = require("sequelize");
const sequelize = require("../../../common/config/db");

const PolicyHistory = sequelize.define("PolicyHistory", {
    policy_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    version: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    rule_snapshot: {
        type: DataTypes.JSONB,
        allowNull: false,
    }
}, {
    tableName: "policy_history",
    underscored: true,
});

module.exports = PolicyHistory;