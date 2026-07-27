// 법령/가이드라인 문서(예: 신용정보법)
const { DataTypes } = require("sequelize");
const sequelize = require("../../../common/config/db");

const RegulationDocument = sequelize.define("RegulationDocument", {
    doc_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    revised_at: {
        type: DataTypes.DATEONLY, //날짜만( 시간없이)
        allowNull: true,
    }
},{
    tableName: "regulation_document",
    underscored: true,
});

module.exports = RegulationDocument;