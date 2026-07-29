'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ai_tool_applications', 'api_base_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn('ai_tool_applications', 'api_model_id', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });
    await queryInterface.addColumn('ai_tool_applications', 'api_key_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('ai_tool_applications', 'api_key_iv', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('ai_tool_applications', 'api_key_auth_tag', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('ai_tool_applications', 'credential_configured', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ai_tool_applications', 'credential_configured');
    await queryInterface.removeColumn('ai_tool_applications', 'api_key_auth_tag');
    await queryInterface.removeColumn('ai_tool_applications', 'api_key_iv');
    await queryInterface.removeColumn('ai_tool_applications', 'api_key_encrypted');
    await queryInterface.removeColumn('ai_tool_applications', 'api_model_id');
    await queryInterface.removeColumn('ai_tool_applications', 'api_base_url');
  },
};
