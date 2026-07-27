'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_tool_applications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      // 실제 라이브 DB에는 FK 제약이 안 걸려있어서 그대로 일반 컬럼으로 맞춘다.
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      applicant_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tool_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      reviewer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      review_comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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
    await queryInterface.dropTable('ai_tool_applications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ai_tool_applications_status";');
  },
};
