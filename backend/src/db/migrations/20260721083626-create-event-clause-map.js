'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('event_clause_map', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usage_log', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      clause_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'regulation_clause', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      match_score: {
        type: Sequelize.INTEGER
      },
      violation_yn: {
        type: Sequelize.BOOLEAN
      },
      reason: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('event_clause_map');
  }
};