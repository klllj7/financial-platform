"use strict";

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("user_agreements", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      // 약관에 동의한 사용자
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      // 서비스 이용약관 또는 개인정보 수집·이용 동의 구분
      agreement_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },

      // 사용자가 동의한 당시의 약관 버전
      agreement_version: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      // 동의 여부
      is_agreed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      // 실제 약관 동의 시각
      agreed_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      // 회원가입 요청 IP 주소
      user_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      // 브라우저 및 운영체제 정보
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // 사용자별 약관 동의 이력을 조회할 때 사용하는 인덱스
    await queryInterface.addIndex("user_agreements", ["user_id"], {
      name: "idx_user_agreements_user_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("user_agreements");
  },
};