'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
  await queryInterface.addColumn('regulation_clause', 'file_name', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('regulation_clause', 'file_path', {
    type: Sequelize.STRING,
    allowNull: true,
  });
  await queryInterface.addColumn('regulation_clause', 'file_type', {
    type: Sequelize.STRING,
    allowNull: true,
  });
},

async down (queryInterface, Sequelize) {
  await queryInterface.removeColumn('regulation_clause', 'file_name');
  await queryInterface.removeColumn('regulation_clause', 'file_path');
  await queryInterface.removeColumn('regulation_clause', 'file_type');
}
};