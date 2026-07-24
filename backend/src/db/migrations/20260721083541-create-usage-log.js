'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usage_log', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user_info', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      ai_tool_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ai_tool_info', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      policy_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'policy_info', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      event_time: {
        type: Sequelize.DATE
      },
      description: {
        type: Sequelize.TEXT
      },
      risk_grade: {
        type: Sequelize.STRING
      },
      action_status: {
        type: Sequelize.STRING
      },
      complexity_grade: {
        type: Sequelize.STRING
      },
      token_usage: {
        type: Sequelize.INTEGER
      },
      cost: {
        type: Sequelize.DECIMAL
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usage_log');
  }
};