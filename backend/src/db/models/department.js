'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Department.hasMany(models.UserInfo, { foreignKey: 'departmentId' });
      Department.hasMany(models.PolicyInfo, { foreignKey: 'departmentId' });
      Department.hasMany(models.InternalApprovalReport, { foreignKey: 'departmentId' });
      Department.hasMany(models.EvidenceFile, { foreignKey: 'departmentId' });
    }
  }
  Department.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Department',
    tableName: 'department',
    underscored: true
  });
  return Department;
};