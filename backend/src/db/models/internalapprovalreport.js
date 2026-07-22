'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InternalApprovalReport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      InternalApprovalReport.belongsTo(models.Department, { foreignKey: 'departmentId' });
      InternalApprovalReport.belongsTo(models.UserInfo, { as: 'creator', foreignKey: 'createdBy' });
      InternalApprovalReport.belongsTo(models.UserInfo, { as: 'approver', foreignKey: 'approvedBy' });
    }
  }
  InternalApprovalReport.init({
    departmentId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    periodStart: DataTypes.DATE,
    periodEnd: DataTypes.DATE,
    content: DataTypes.TEXT,
    status: DataTypes.STRING,
    createdBy: DataTypes.INTEGER,
    approvedBy: DataTypes.INTEGER,
    reviewerComment: DataTypes.TEXT,
    filePath: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'InternalApprovalReport',
  });
  return InternalApprovalReport;
};