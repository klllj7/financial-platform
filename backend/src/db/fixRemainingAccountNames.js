// touchUpSeedData.js의 이름 자연화가 "OO팀 직원N" 패턴만 잡아서, 그 정규식에
// 안 걸리는 "컴플라이언스 담당자"/"시스템 관리자1"/"시스템 관리자2" 같은 역할명이
// 그대로 남아있는 걸 정비하는 후속 일회성 스크립트.
//
// touchUpSeedData.js와 동일하게 UPDATE만 쓰고, 실행 전 users.name을 백업 테이블로 스냅샷한다.
//
// 실행 방법: node src/db/fixRemainingAccountNames.js (이번 요청에서는 실행하지 않음)

const { Op } = require("sequelize");
const sequelize = require("../common/config/db");
const { User } = require("../domains/auth/auth.models");

const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[randomInt(0, arr.length - 1)];

const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const GIVEN_FIRST = ["서", "민", "지", "도", "하", "윤", "현", "준", "수", "예"];
const GIVEN_SECOND = ["연", "준", "우", "윤", "진", "호", "빈", "아", "원", "린"];

const generateUniqueName = (usedNames) => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = `${pick(SURNAMES)}${pick(GIVEN_FIRST)}${pick(GIVEN_SECOND)}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }
  throw new Error("고유한 이름 후보를 찾지 못했습니다 (이름 풀 소진).");
};

const fixRemainingAccountNames = async () => {
  await sequelize.query(
    `CREATE TABLE IF NOT EXISTS users_name_backup_fix2_${todayStr} AS SELECT id, name FROM users`,
  );
  console.log(`백업 테이블 생성 완료: users_name_backup_fix2_${todayStr}`);

  // touchUpSeedData.js가 놓친 "직원" 이외의 역할명(관리자/담당자)까지 넓게 잡는다.
  // 이미 자연스러운 3글자 사람 이름은 이 패턴에 매칭되지 않는다.
  const targets = await User.findAll({
    where: { name: { [Op.regexp]: "(직원|관리자|담당자)[0-9]*$" } },
    attributes: ["id", "email", "name"],
  });

  // 이미 자연화된 이름과 겹치지 않도록, 기존 사람 이름 전체를 usedNames에 미리 채워둔다.
  const allUsers = await User.findAll({ attributes: ["name"] });
  const usedNames = new Set(allUsers.map((u) => u.name));

  const mapping = [];
  for (const user of targets) {
    const newName = generateUniqueName(usedNames);
    await User.update({ name: newName }, { where: { id: user.id } });
    mapping.push({ email: user.email, before: user.name, after: newName });
  }

  console.log(`[이름 자연화 2차] 대상 ${targets.length}건 중 ${mapping.length}건 변경`);
  mapping.forEach((m) => console.log(`  ${m.email}: "${m.before}" -> "${m.after}"`));
  return mapping;
};

if (require.main === module) {
  const run = async () => {
    try {
      await sequelize.authenticate();
      await fixRemainingAccountNames();
      process.exit(0);
    } catch (error) {
      console.error("이름 자연화 2차 스크립트 실패: ", error);
      process.exit(1);
    }
  };
  run();
}

module.exports = { fixRemainingAccountNames };
