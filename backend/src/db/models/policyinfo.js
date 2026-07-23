'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PolicyInfo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      PolicyInfo.belongsTo(models.Department, { foreignKey: 'departmentId' });
      PolicyInfo.hasMany(models.PolicyHistory, { foreignKey: 'policyId' });
      PolicyInfo.hasMany(models.UsageLog, { foreignKey: 'policyId' });    
    }
  }
  PolicyInfo.init({
    departmentId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    ruleContent: DataTypes.JSONB,
    version: DataTypes.INTEGER,
    activeYn: DataTypes.BOOLEAN,
    approvalStatus: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'PolicyInfo',
    tableName: 'policyinfo', 
    underscored: true
  });
  return PolicyInfo;
};