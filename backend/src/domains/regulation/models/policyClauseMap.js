const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

const PolicyClauseMap = sequelize.define("PolicyClauseMap", {
    policy_id: {
        type: DataTypes.INTEGER,
        allowNull : false
    },
    clause_id: {
        type: DataTypes.INTEGER,
        allowNull : false
    }
},{
    tableName: "policy_clause_map",
    underscored: true,
});

module.exports = PolicyClauseMap;