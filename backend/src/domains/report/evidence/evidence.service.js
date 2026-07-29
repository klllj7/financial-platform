const EvidenceFile = require("./evidenceFile.model");
const { CATEGORY_META, NA_CATEGORIES, CHECKLIST_ITEMS } = require("./checklistItems");
const { saveEvidenceFile } = require("./fileStorage");
const {
  getExpandedRiskEvents,
  BLOCK_TYPES,
  PII_TYPES,
} = require("../internal-report/services/aggregateRiskEvents");

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
      // FE가 실제 다운로드 링크(/uploads/evidence/...)를 만들 때 쓴다.
      filePath: match?.file_path ?? null,
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
// --- csv/json 변환: 별도 파일 없이 로컬 헬퍼로만 둔다 (각 10줄 안팎이라 분리 불필요) ---
const escapeCsvValue = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
const generateCsv = (rows, headers) => {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(","));
  return [headerLine, ...dataLines].join("\n");
};
const generateJson = (payload) => JSON.stringify(payload, null, 2);
// TODO(다음 단계): ②③번(xlsx)은 exceljs, ①⑧⑨번(pdf)은 puppeteer가 필요하다.
// 둘 다 backend/package.json에 아직 설치돼 있지 않아 이번 작업 범위에서 제외했다.

// detector.py의 PII_PATTERNS/PROMPT_INJECTION_PATTERNS 구조를 그대로 옮긴 것이 아니라
// "룰셋이 존재한다"는 사실과 차단 대상 유형만 문서화용으로 요약한 스냅샷이다.
// ⚠️ detector.py의 패턴이 추가/변경되면 이 목록도 함께 갱신해야 한다.
const RULESET_SNAPSHOT = {
  piiPatternTypes: ["resident_number", "phone_number", "account_number", "card_number", "email"],
  promptInjectionPatternCount: 12, // detector.py PROMPT_INJECTION_PATTERNS.prompt_injection 배열 길이
  blockTypes: Array.from(BLOCK_TYPES),
};

/**
 * evidence_file 테이블에 생성 결과를 upsert한다.
 * item_result는 여기서 자동으로 정하지 않는다 — 생성은 "파일을 만드는 것"까지만
 * 담당하고, 이행/부분이행/미이행 확정은 항상 사람이 팝업에서 골라
 * PATCH /:itemNo/result(updateItemResult)로 저장한다. 새 row라 아직 값이 없으면
 * getEvidenceChecklist가 기본값 "미이행"으로 보여준다.
 */
const upsertGeneratedEvidence = async ({
  departmentId, targetYear, itemNo, fileName, fileType, filePath,
}) => {
  const [row] = await EvidenceFile.findOrCreate({
    where: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
    defaults: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
  });

  row.file_name = fileName;
  row.file_type = fileType;
  row.file_path = filePath;
  row.source_type = "auto";
  await row.save();

  return { itemNo, fileName, filePath, result: row.item_result ?? "미이행" };
};

/** ⑤ 입력 정상범위 사전검토 — 룰셋 스냅샷 + 차단된 이벤트 로그, json */
const generateEvidence5 = async ({ departmentId, targetYear, from, to }) => {
  const rows = await getExpandedRiskEvents({ from, to });
  const blockedEvents = rows
    .filter((r) => r.actionStatus === "blocked")
    .map((r) => ({
      eventId: r.eventId,
      type: r.type,
      grade: r.grade,
      createdAt: r.createdAt,
      maskedDescription: r.maskedDescription, // 원문 금지, 마스킹본만 포함
    }));

  const payload = { ruleset: RULESET_SNAPSHOT, blockedEvents };
  const fileName = `입력검증룰셋_설정_${targetYear}.json`;
  const relativePath = `5/${departmentId}/${targetYear}/${fileName}`;
  const filePath = await saveEvidenceFile(relativePath, generateJson(payload));

  return upsertGeneratedEvidence({
    departmentId, targetYear, itemNo: "5",
    fileName, fileType: "json", filePath,
  });
};

/** ⑥ 우회시도 탐지·차단 — prompt_injection 유형만, csv */
const generateEvidence6 = async ({ departmentId, targetYear, from, to }) => {
  const rows = await getExpandedRiskEvents({ from, to });
  const filtered = rows
    .filter((r) => r.type === "prompt_injection")
    .map((r) => ({
      event_id: r.eventId,
      created_at: r.createdAt,
      grade: r.grade,
      action_status: r.actionStatus,
      masked_description: r.maskedDescription, // 원문 금지
    }));

  const csv = generateCsv(filtered, ["event_id", "created_at", "grade", "action_status", "masked_description"]);
  const fileName = `탈옥탐지로그_${targetYear}.csv`;
  const relativePath = `6/${departmentId}/${targetYear}/${fileName}`;
  const filePath = await saveEvidenceFile(relativePath, csv);

  return upsertGeneratedEvidence({
    departmentId, targetYear, itemNo: "6",
    fileName, fileType: "csv", filePath,
  });
};

/** ⑦ PII 탐지·마스킹 — PII 유형만, csv */
const generateEvidence7 = async ({ departmentId, targetYear, from, to }) => {
  const rows = await getExpandedRiskEvents({ from, to });
  const filtered = rows
    .filter((r) => PII_TYPES.has(r.type))
    .map((r) => ({
      event_id: r.eventId,
      created_at: r.createdAt,
      type: r.type,
      grade: r.grade,
      action_status: r.actionStatus,
      masked_description: r.maskedDescription, // 원문 금지
    }));

  const csv = generateCsv(filtered, ["event_id", "created_at", "type", "grade", "action_status", "masked_description"]);
  const fileName = `PII마스킹이벤트로그_${targetYear}.csv`;
  const relativePath = `7/${departmentId}/${targetYear}/${fileName}`;
  const filePath = await saveEvidenceFile(relativePath, csv);

  return upsertGeneratedEvidence({
    departmentId, targetYear, itemNo: "7",
    fileName, fileType: "csv", filePath,
  });
};

const GENERATORS_BY_ITEM_NO = {
  5: generateEvidence5,
  6: generateEvidence6,
  7: generateEvidence7,
};

const generateEvidenceItem = async ({ departmentId, targetYear, itemNo, from, to }) => {
  const generator = GENERATORS_BY_ITEM_NO[itemNo];
  if (!generator) {
    const error = new Error(`itemNo ${itemNo}는 아직 자동생성을 지원하지 않습니다.`);
    error.code = "EVIDENCE_GENERATE_UNSUPPORTED";
    error.statusCode = 400;
    throw error;
  }
  return generator({ departmentId, targetYear, from, to });
};


module.exports = {
  getEvidenceChecklist,
  updateItemResult,
  getEvidenceSummary,
  generateEvidenceItem,
};
