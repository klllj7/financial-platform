'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PolicyHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PolicyHistory.init({
    policyId: DataTypes.INTEGER,
    version: DataTypes.INTEGER,
    ruleSnapshot: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'PolicyHistory',
  });
  return PolicyHistory;
};