'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EventClauseMap extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      EventClauseMap.belongsTo(models.UsageLog, { foreignKey: 'eventId' });
      EventClauseMap.belongsTo(models.RegulationClause, { foreignKey: 'clauseId' });
    }
  }
  EventClauseMap.init({
    eventId: DataTypes.INTEGER,
    clauseId: DataTypes.INTEGER,
    matchScore: DataTypes.INTEGER,
    violationYn: DataTypes.BOOLEAN,
    reason: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'EventClauseMap',
  });
  return EventClauseMap;
};