// const getEvidenceChecklist = async () => {
//     return {
//         categoryMeta: [],
//         naCategories: [],
//         items: []
//     };
// };
// module.exports = {
//     getEvidenceChecklist
// };


const { EvidenceFile } = require("../../../db/models");
const CHECKLIST_ITEMS = require("./checklistItems"); // 38개 마스터 목록 (프론트 mock에서 이식)

const getEvidenceChecklist = async ({ departmentId, targetYear }) => {
  // 부서+연도에 해당하는 실제 업로드 현황 조회
  const uploaded = await EvidenceFile.findAll({
    where: { departmentId, targetYear },
  });

  // 마스터 목록에 실제 업로드 여부를 매칭
  const items = CHECKLIST_ITEMS.map((item) => {
    const match = uploaded.find((f) => f.itemNo === item.no);
    return {
      ...item,
      evidence: match ? "준비완료" : "미준비",
      file: match?.fileName ?? null,
    };
  });

  return { categoryMeta: CATEGORY_META, naCategories: NA_CATEGORIES, items };
};

module.exports = { getEvidenceChecklist };