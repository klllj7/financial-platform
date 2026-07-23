'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internal_approval_report', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'department', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      title: {
        type: Sequelize.STRING
      },
      period_start: {
        type: Sequelize.DATE
      },
      period_end: {
        type: Sequelize.DATE
      },
      content: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'user_info', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'user_info', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      reviewer_comment: {
        type: Sequelize.TEXT
      },
      file_path: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('internal_approval_report');
  }
};