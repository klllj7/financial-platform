'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ActionHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ActionHistory.belongsTo(models.UsageLog, { foreignKey: 'eventId' });
      ActionHistory.belongsTo(models.UserInfo, { as: 'actor', foreignKey: 'actorUserId' });
    }
  }
  ActionHistory.init({
    eventId: DataTypes.INTEGER,
    actorUserId: DataTypes.INTEGER,
    actionType: DataTypes.STRING,
    actionReason: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'ActionHistory',
  });
  return ActionHistory;
};