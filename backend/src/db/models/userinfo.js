'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserInfo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserInfo.belongsTo(models.Department, { foreignKey: 'departmentId' });
      UserInfo.belongsTo(models.RoleInfo, { foreignKey: 'roleId' });
      UserInfo.hasMany(models.LoginHistory, { foreignKey: 'userId' });
      UserInfo.hasMany(models.UsageLog, { foreignKey: 'userId' });
      UserInfo.hasMany(models.ActionHistory, { foreignKey: 'actorUserId' });    
    }
  }
  UserInfo.init({
    departmentId: DataTypes.INTEGER,
    roleId: DataTypes.INTEGER,
    loginId: DataTypes.STRING,
    passwordHash: DataTypes.STRING,
    name: DataTypes.STRING,
    email: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserInfo',
    tableName: 'userinfo',
    underscored: true
  });
  return UserInfo;
};