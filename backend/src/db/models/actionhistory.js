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
      // define association here
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