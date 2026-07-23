'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AiToolInfo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AiToolInfo.hasMany(models.UsageLog, { foreignKey: 'aiToolId' });
    }
  }
  AiToolInfo.init({
    modelName: DataTypes.STRING,
    platform: DataTypes.STRING,
    approvedYn: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'AiToolInfo',
    tableName: 'ai_tool_info',
    underscored: true,
  });
  return AiToolInfo;
};