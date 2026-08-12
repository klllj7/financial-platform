'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ai_tool_applications', 'bedrock_model_id', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
    await queryInterface.addColumn('ai_tool_applications', 'bedrock_model_name', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
    await queryInterface.addColumn('ai_tool_applications', 'model_source', {
      type: Sequelize.ENUM('BEDROCK', 'CUSTOM'),
      allowNull: false,
      defaultValue: 'BEDROCK',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ai_tool_applications', 'model_source');
    await queryInterface.removeColumn('ai_tool_applications', 'bedrock_model_name');
    await queryInterface.removeColumn('ai_tool_applications', 'bedrock_model_id');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_tool_applications_model_source";');
  },
};
