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
}, {
    tableName: "regulation_clause",
    undersocred: true,
});