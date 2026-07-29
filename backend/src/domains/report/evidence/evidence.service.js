const EvidenceFile = require("./evidenceFile.model");
const { CATEGORY_META, NA_CATEGORIES, CHECKLIST_ITEMS } = require("./checklistItems");

const getEvidenceChecklist = async ({ departmentId, targetYear }) => {
  const uploaded = await EvidenceFile.findAll({
    where: { department_id: departmentId, target_year: targetYear },
  });

  const items = CHECKLIST_ITEMS.map((item) => {
    const match = uploaded.find((f) => f.item_no === item.no);
    return {
      ...item,                 // ← 여기서 원본 필드를 전부 복사
      result: match?.item_result ?? "미이행",
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

/* 전사 대시보드용으로 실제 업로드된 증빙의 전체·대항목별 준비율을 계산한다. */
const getEvidenceSummary = async ({ targetYear }) => {
  const uploaded = await EvidenceFile.findAll({
    attributes: ["item_no", "file_name"],
    where: { target_year: targetYear },
  });
  const preparedItemNumbers = new Set(
    uploaded
      .filter((file) => file.file_name)
      .map((file) => String(file.item_no)),
  );
  const categories = CATEGORY_META.map((category) => {
    const categoryItems = CHECKLIST_ITEMS.filter(
      (item) => item.category === category.key,
    );
    const preparedCount = categoryItems.filter((item) =>
      preparedItemNumbers.has(String(item.no)),
    ).length;

    return {
      key: category.key,
      label: category.label,
      preparedCount,
      totalCount: categoryItems.length,
      percentage: categoryItems.length
        ? Math.round((preparedCount / categoryItems.length) * 100)
        : 0,
    };
  });
  const preparedCount = CHECKLIST_ITEMS.filter((item) =>
    preparedItemNumbers.has(String(item.no)),
  ).length;

  return {
    targetYear,
    preparedCount,
    totalCount: CHECKLIST_ITEMS.length,
    overallPercentage: CHECKLIST_ITEMS.length
      ? Math.round((preparedCount / CHECKLIST_ITEMS.length) * 100)
      : 0,
    categories,
  };
};

module.exports = {
  getEvidenceChecklist,
  updateItemResult,
  getEvidenceSummary,
};
