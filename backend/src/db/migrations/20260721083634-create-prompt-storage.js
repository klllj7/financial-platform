'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prompt_storage', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'usage_log', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      original_prompt: {
        type: Sequelize.TEXT
      },
      masked_prompt: {
        type: Sequelize.TEXT
      },
      encrypted_prompt: {
        type: Sequelize.TEXT
      },
      expires_at: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('prompt_storage');
  }
};