'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LoginHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      LoginHistory.belongsTo(models.UserInfo, { foreignKey: 'userId' });
    }
  }
  LoginHistory.init({
    userId: DataTypes.INTEGER,
    attemptTime: DataTypes.DATE,
    successYn: DataTypes.BOOLEAN,
    failReason: DataTypes.STRING,
    ipAddr: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'LoginHistory',
    tableName: 'loginhistory', 
    underscored: true
  });
  return LoginHistory;
};