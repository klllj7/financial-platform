'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UsageLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      aiToolId: {
        type: Sequelize.INTEGER
      },
      policyId: {
        type: Sequelize.INTEGER
      },
      eventTime: {
        type: Sequelize.DATE
      },
      description: {
        type: Sequelize.TEXT
      },
      riskGrade: {
        type: Sequelize.STRING
      },
      actionStatus: {
        type: Sequelize.STRING
      },
      complexityGrade: {
        type: Sequelize.STRING
      },
      tokenUsage: {
        type: Sequelize.INTEGER
      },
      cost: {
        type: Sequelize.DECIMAL
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UsageLogs');
  }
};