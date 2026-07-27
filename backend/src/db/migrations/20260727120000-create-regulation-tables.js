'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('regulation_document', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      doc_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      revised_at: {
        type: Sequelize.DATEONLY,
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

    await queryInterface.createTable('regulation_clause', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      // 정책 도메인 모델들과 같은 컨벤션으로, FK 제약은 안 걸고 일반 컬럼으로 둔다.
      doc_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      clause_no: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
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

    await queryInterface.createTable('policy_clause_map', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      policy_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      clause_id: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('policy_clause_map');
    await queryInterface.dropTable('regulation_clause');
    await queryInterface.dropTable('regulation_document');
  },
};
