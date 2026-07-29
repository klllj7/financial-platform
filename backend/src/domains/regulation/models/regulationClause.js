const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

const RegulationClause = sequelize.define("RegulationClause", {
    doc_id: {
        type: DataTypes.INTEGER,
        allowNull : false
    },
    clause_no: {
        type: DataTypes.STRING,
        allowNull:false

    },
    title: {
    type: DataTypes.STRING,
    allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    file_type: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: "regulation_clause",
    underscored: true,
});
module.exports = RegulationClause;