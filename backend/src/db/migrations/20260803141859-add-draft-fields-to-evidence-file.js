'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('evidence_file', 'draft_content', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('evidence_file', 'is_edited', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('evidence_file', 'edited_content', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('evidence_file', 'secondary_file_name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('evidence_file', 'secondary_file_type', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('evidence_file', 'secondary_file_path', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('evidence_file', 'log_entries', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('evidence_file', 'log_entries');
    await queryInterface.removeColumn('evidence_file', 'secondary_file_path');
    await queryInterface.removeColumn('evidence_file', 'secondary_file_type');
    await queryInterface.removeColumn('evidence_file', 'secondary_file_name');
    await queryInterface.removeColumn('evidence_file', 'edited_content');
    await queryInterface.removeColumn('evidence_file', 'is_edited');
    await queryInterface.removeColumn('evidence_file', 'draft_content');
  },
};
