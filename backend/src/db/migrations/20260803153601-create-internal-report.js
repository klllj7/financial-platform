'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('internal_report', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      document_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department_filter: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      period_start: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      period_end: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      risk_threshold: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      report_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      generated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      generated_by_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      generated_by_department: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      snapshot: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('internal_report');
  },
};
