"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /* Solar가 반환한 실제 입·출력 토큰 수를 채팅 응답에 저장한다. */
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("chat_messages");

    // 개발 환경의 sequelize.sync가 먼저 컬럼을 만든 경우에도 안전하게 동작한다.
    if (!columns.input_tokens) {
      await queryInterface.addColumn("chat_messages", "input_tokens", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
    if (!columns.output_tokens) {
      await queryInterface.addColumn("chat_messages", "output_tokens", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable("chat_messages");

    if (columns.output_tokens) {
      await queryInterface.removeColumn("chat_messages", "output_tokens");
    }
    if (columns.input_tokens) {
      await queryInterface.removeColumn("chat_messages", "input_tokens");
    }
  },
};
