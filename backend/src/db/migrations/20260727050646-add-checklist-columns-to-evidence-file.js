'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('evidence_file', 'item_no', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('evidence_file', 'item_title', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('evidence_file', 'item_result', {
      type: Sequelize.STRING, // 이행 / 부분이행 / 미이행 / 해당없음
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('evidence_file', 'item_result');
    await queryInterface.removeColumn('evidence_file', 'item_title');
    await queryInterface.removeColumn('evidence_file', 'item_no');
  },
};
