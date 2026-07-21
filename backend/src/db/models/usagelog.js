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
      // define association here
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