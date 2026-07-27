const EvidenceFile = require("./evidenceFile.model");
const { CATEGORY_META, NA_CATEGORIES, CHECKLIST_ITEMS } = require("./checklistItems");

const getEvidenceChecklist = async ({ departmentId, targetYear }) => {
  const uploaded = await EvidenceFile.findAll({
    where: { department_id: departmentId, target_year: targetYear },
  });

  const items = CHECKLIST_ITEMS.map((item) => {
    const match = uploaded.find((f) => f.item_no === item.no);
    return {
      ...item,
      result: match?.item_result ?? "미이행",   // 추가: 마스터 목록 값 대신 DB 값 사용
      evidence: match?.file_name ? "준비완료" : "미준비",
      file: match?.file_name ?? null,
    };
  });

  return { categoryMeta: CATEGORY_META, naCategories: NA_CATEGORIES, items };
};

const updateItemResult = async ({ departmentId, targetYear, itemNo, result }) => {
  const [row] = await EvidenceFile.findOrCreate({
    where: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
    defaults: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
  });

  row.item_result = result;
  await row.save();

  return { itemNo, result };
};

module.exports = { getEvidenceChecklist, updateItemResult };
