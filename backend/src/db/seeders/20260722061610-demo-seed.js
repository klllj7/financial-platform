'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('role_info', [
      { name: '임직원', description: '일반 임직원', created_at: now, updated_at: now },
      { name: '보안·컴플라이언스 담당자', description: '리스크 검토 및 증빙 준비', created_at: now, updated_at: now },
      { name: '관리자', description: '시스템 최고 권한자', created_at: now, updated_at: now },
    ]);

    await queryInterface.bulkInsert('department', [
      { name: '여신팀', description: '여신 심사 부서', created_at: now, updated_at: now },
      { name: '준법감시팀', description: '컴플라이언스 부서', created_at: now, updated_at: now },
    ]);

    const passwordHash = await bcrypt.hash('test1234', 10);

    await queryInterface.bulkInsert('user_info', [
      {
        department_id: 1,
        role_id: 1,
        login_id: 'user1',
        password_hash: passwordHash,
        name: '홍길동',
        email: 'user1@test.com',
        created_at: now,
        updated_at: now,
      },
      {
        department_id: 2,
        role_id: 3,
        login_id: 'admin1',
        password_hash: passwordHash,
        name: '김관리',
        email: 'admin1@test.com',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_info', null, {});
    await queryInterface.bulkDelete('department', null, {});
    await queryInterface.bulkDelete('role_info', null, {});
  },
};