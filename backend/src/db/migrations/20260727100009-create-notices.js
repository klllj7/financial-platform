'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '일반',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      // 실제 라이브 DB에는 FK 제약이 안 걸려있어서 그대로 일반 컬럼으로 맞춘다.
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      author_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      department_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.dropTable('notices');
  },
};
