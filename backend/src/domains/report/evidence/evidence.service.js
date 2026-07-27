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
      evidence: match ? "준비완료" : "미준비",
      file: match?.file_name ?? null,
    };
  });

  return { categoryMeta: CATEGORY_META, naCategories: NA_CATEGORIES, items };
};

module.exports = { getEvidenceChecklist };
