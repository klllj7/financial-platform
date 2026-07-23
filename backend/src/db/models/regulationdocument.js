'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RegulationDocument extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      RegulationDocument.hasMany(models.RegulationClause, { foreignKey: 'docId' });
    }
  }
  RegulationDocument.init({
    docName: DataTypes.STRING,
    source: DataTypes.STRING,
    revisedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'RegulationDocument',
    tableName: 'regulation_document',
    underscored: true,
  });
  return RegulationDocument;
};