'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('chat_sessions', 'ai_tool_application_id', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
    await queryInterface.addColumn('chat_sessions', 'tool_key', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('chat_sessions', 'tool_key');
    await queryInterface.removeColumn('chat_sessions', 'ai_tool_application_id');
  },
};
