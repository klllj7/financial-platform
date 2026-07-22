'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UsageLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UsageLog.belongsTo(models.UserInfo, { foreignKey: 'userId' });
      UsageLog.belongsTo(models.AiToolInfo, { foreignKey: 'aiToolId' });
      UsageLog.belongsTo(models.PolicyInfo, { foreignKey: 'policyId' });
      UsageLog.hasMany(models.EventLog, { foreignKey: 'eventId' });
      UsageLog.hasMany(models.ActionHistory, { foreignKey: 'eventId' });
      UsageLog.hasMany(models.EventClauseMap, { foreignKey: 'eventId' });
      UsageLog.hasMany(models.EvidenceFile, { foreignKey: 'eventId' });
      UsageLog.hasOne(models.PromptStorage, { foreignKey: 'eventId' });
    }
  }
  UsageLog.init({
    userId: DataTypes.INTEGER,
    aiToolId: DataTypes.INTEGER,
    policyId: DataTypes.INTEGER,
    eventTime: DataTypes.DATE,
    description: DataTypes.TEXT,
    riskGrade: DataTypes.STRING,
    actionStatus: DataTypes.STRING,
    complexityGrade: DataTypes.STRING,
    tokenUsage: DataTypes.INTEGER,
    cost: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'UsageLog',
  });
  return UsageLog;
};