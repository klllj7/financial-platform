'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('evidence_file', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'department', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },   // user_info→users로 이름 바뀜
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      target_year: { type: Sequelize.INTEGER },
      category_tag: { type: Sequelize.STRING },
      item_no: { type: Sequelize.STRING },
      item_title: { type: Sequelize.STRING },
      item_result: { type: Sequelize.STRING },
      file_name: { type: Sequelize.STRING },
      file_type: { type: Sequelize.STRING },
      file_path: { type: Sequelize.STRING },
      source_type: { type: Sequelize.STRING },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('evidence_file');
  },
};
