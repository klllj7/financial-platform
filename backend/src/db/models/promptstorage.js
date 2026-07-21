'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PromptStorage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  PromptStorage.init({
    eventId: DataTypes.INTEGER,
    originalPrompt: DataTypes.TEXT,
    maskedPrompt: DataTypes.TEXT,
    encryptedPrompt: DataTypes.TEXT,
    expiresAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'PromptStorage',
  });
  return PromptStorage;
};