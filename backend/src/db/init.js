const sequelize = require("../common/config/db");
const { Role, Department } = require("../domains/auth/auth.models");
const RegulationDocument = require("../domains/regulation/models/regulationDocument");
const RegulationClause = require("../domains/regulation/models/regulationClause");
const PolicyClauseMap = require("../domains/regulation/models/policyClauseMap");

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

// 규제매핑 화면 테스트용 샘플 법령/조항/매핑 데이터를 생성하는 함수
const seedRegulationData = async () => {
  // 법령 문서 2건
  const [creditInfoAct] = await RegulationDocument.findOrCreate({
    where: { doc_name: "신용정보의 이용 및 보호에 관한 법률" },
    defaults: { revised_at: "2025-03-01" },
  });

  const [privacyAct] = await RegulationDocument.findOrCreate({
    where: { doc_name: "개인정보 보호법" },
    defaults: { revised_at: "2025-01-01" },
  });

  // 신용정보법 조항
  const [clause32] = await RegulationClause.findOrCreate({
    where: { doc_id: creditInfoAct.id, clause_no: "제32조" },
    defaults: {
      title: "개인신용정보 제공·이용 동의",
      description: "신용정보회사등이 개인신용정보를 제3자에게 제공하려면 미리 해당 신용정보주체의 동의를 받아야 한다.",
    },
  });

  const [clause20] = await RegulationClause.findOrCreate({
    where: { doc_id: creditInfoAct.id, clause_no: "제20조" },
    defaults: {
      title: "신용정보 관리·보호 체계 구축",
      description: "신용정보회사등은 신용정보전산시스템의 안전보호 및 신용정보 누설 방지를 위한 관리적·물리적·기술적 보안대책을 수립·시행해야 한다.",
    },
  });

  // 개인정보 보호법 조항
  const [clause23] = await RegulationClause.findOrCreate({
    where: { doc_id: privacyAct.id, clause_no: "제23조" },
    defaults: {
      title: "민감정보의 처리 제한",
      description: "개인정보처리자는 사상·신념, 건강 등 민감정보를 처리해서는 안 되며, 예외적으로 처리하는 경우 별도 동의를 받아야 한다.",
    },
  });

  const [clause29] = await RegulationClause.findOrCreate({
    where: { doc_id: privacyAct.id, clause_no: "제29조" },
    defaults: {
      title: "안전조치의무",
      description: "개인정보처리자는 개인정보가 분실·도난·유출·위조·변조 또는 훼손되지 않도록 내부관리계획 수립 등 안전성 확보에 필요한 조치를 해야 한다.",
    },
  });

  // 기존 승인된 정책(id=1, "개인정보 입력 시 마스킹") 하나를 조항과 매핑해서 예시로 연결
  await PolicyClauseMap.findOrCreate({
    where: { policy_id: 1, clause_id: clause29.id },
  });

  console.log("규제매핑 샘플 데이터 준비 완료");
};

// npm run seed로 직접 실행할 수도 있게 처리
if (require.main === module) {
  const runSeed = async () => {
    try {
      await sequelize.authenticate();
      // sequelize.sync({ alter: true }) 제거함 (공유 DB에서 위험 — 마이그레이션으로 대체)
      await seedBasicData();
      await seedRegulationData();

      console.log("Seed 실행 완료");
      process.exit(0);
    } catch (error) {
      console.error("Seed 실행 실패: ", error);
      process.exit(1);
    }
  };

  runSeed();
}

module.exports = { seedBasicData, seedRegulationData };