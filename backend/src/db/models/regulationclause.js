'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RegulationClause extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      RegulationClause.belongsTo(models.RegulationDocument, { foreignKey: 'docId' });
      RegulationClause.hasMany(models.EventClauseMap, { foreignKey: 'clauseId' });    
    }
  }
  RegulationClause.init({
    docId: DataTypes.INTEGER,
    clauseNo: DataTypes.STRING,
    title: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'RegulationClause',
    tableName: 'regulationclause', 
    underscored: true
  });
  return RegulationClause;
};