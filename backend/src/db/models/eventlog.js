'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EventLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      EventLog.belongsTo(models.UsageLog, { foreignKey: 'eventId' });
    }
  }
  EventLog.init({
    eventId: DataTypes.INTEGER,
    detectionType: DataTypes.STRING,
    maskedYn: DataTypes.BOOLEAN,
    grade: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'EventLog',
  });
  return EventLog;
};