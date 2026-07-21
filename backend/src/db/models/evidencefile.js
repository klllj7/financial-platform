'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EvidenceFile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  EvidenceFile.init({
    departmentId: DataTypes.INTEGER,
    eventId: DataTypes.INTEGER,
    targetYear: DataTypes.INTEGER,
    categoryTag: DataTypes.STRING,
    fileName: DataTypes.STRING,
    fileType: DataTypes.STRING,
    filePath: DataTypes.STRING,
    sourceType: DataTypes.STRING,
    uploadedBy: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'EvidenceFile',
  });
  return EvidenceFile;
};