const sequelize = require("../common/config/db");
const { Role, Department } = require("../domains/auth/auth.models");

// 기본 권한/부서 데이터를 생성하는 함수
const seedBasicData = async () => {
  // 기본 권한 생성
  await Role.findOrCreate({
    where: { code: "EMPLOYEE" },
    defaults: {
      name: "임직원",
      description: "일반 AI 사용자",
    },
  });

  await Role.findOrCreate({
    where: { code: "COMPLIANCE_MANAGER" },
    defaults: {
      name: "보안/컴플라이언스 담당자",
      description: "위험 이벤트 및 규제 대응 담당자",
    },
  });

  await Role.findOrCreate({
    where: { code: "ADMIN" },
    defaults: {
      name: "관리자",
      description: "시스템 최고 관리자",
    },
  });

  // 기본 부서 생성
  await Department.findOrCreate({
    where: { code: "LOAN_REVIEW" },
    defaults: { name: "여신심사팀" },
  });

  await Department.findOrCreate({
    where: { code: "MARKETING" },
    defaults: { name: "마케팅팀" },
  });

  await Department.findOrCreate({
    where: { code: "IT_SECURITY" },
    defaults: { name: "IT보안팀" },
  });

  await Department.findOrCreate({
    where: { code: "COMPLIANCE" },
    defaults: { name: "준법감시팀" },
  });

  await Department.findOrCreate({
    where: { code: "CUSTOMER_SERVICE" },
    defaults: { name: "고객지원팀" },
  });

  console.log("기본 권한/부서 데이터 준비 완료");
};

// npm run seed로 직접 실행할 수도 있게 처리
if (require.main === module) {
  const runSeed = async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      await seedBasicData();

      console.log("Seed 실행 완료");
      process.exit(0);
    } catch (error) {
      console.error("Seed 실행 실패: ", error);
      process.exit(1);
    }
  };

  runSeed();
}

module.exports = seedBasicData;