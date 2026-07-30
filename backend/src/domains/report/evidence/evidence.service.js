const EvidenceFile = require("./evidenceFile.model");
const { Op } = require("sequelize");
const User = require("../../auth/user.model");
const UsageLog = require("./usageLog.model");
const ActionHistory = require("./actionHistory.model");
const { CATEGORY_META, NA_CATEGORIES, CHECKLIST_ITEMS } = require("./checklistItems");
const { saveEvidenceFile } = require("./fileStorage");
const QUERY_COUNT_THRESHOLD = 100; // 설정 테이블 생기기 전까지 상수로 관리
const QUERY_MONITOR_PERIOD_DAYS = 90;

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
      ...item,
      result: match?.item_result ?? "미이행",
      evidence: match?.file_name ? "준비완료" : "미준비",
      file: match?.file_name ?? null,
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

/* 전사 대시보드용으로 실제 업로드된 증빙의 전체·대항목별 준비율 계산 */
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
// --- csv/json 변환 ---
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

const RULESET_SNAPSHOT = {
  piiPatternTypes: ["resident_number", "phone_number", "account_number", "card_number", "email"],
  promptInjectionPatternCount: 12, // detector.py PROMPT_INJECTION_PATTERNS.prompt_injection 배열 길이
  blockTypes: Array.from(BLOCK_TYPES),
};


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

/** ⑧ 출력·에러메시지 내 기밀정보 노출 방지 — confidential_similarity 유형만, csv
 *  스펙의 "output_leak_block" 신규 태깅은 event_log에 아직 없는 유형이라 제외했다.
 */
const generateEvidence8 = async ({ departmentId, targetYear, from, to }) => {
  const rows = await getExpandedRiskEvents({ from, to });
  const filtered = rows
    .filter((r) => r.type === "confidential_similarity")
    .map((r) => ({
      event_id: r.eventId,
      created_at: r.createdAt,
      grade: r.grade,
      action_status: r.actionStatus,
      masked_description: r.maskedDescription,
    }));

  const csv = generateCsv(filtered, ["event_id", "created_at", "grade", "action_status", "masked_description"]);
  const fileName = `기밀정보노출차단로그_${targetYear}.csv`;
  const filePath = await saveEvidenceFile(`8/${departmentId}/${targetYear}/${fileName}`, csv);

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "8", fileName, fileType: "csv", filePath });
};


const generateEvidence12 = async ({ departmentId, targetYear, from, to }) => {
  const rangeTo = to ?? new Date();
  const rangeFrom = from ?? new Date(rangeTo.getTime() - QUERY_MONITOR_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const deptUsers = await User.findAll({ attributes: ["id"], where: { department_id: departmentId } });
  const userIds = deptUsers.map((u) => u.id);

  const logs = userIds.length
    ? await UsageLog.findAll({
        attributes: ["user_id", "created_at"],
        where: { user_id: { [Op.in]: userIds }, created_at: { [Op.between]: [rangeFrom, rangeTo] } },
      })
    : [];

  const countByUser = new Map();
  logs.forEach((l) => countByUser.set(l.user_id, (countByUser.get(l.user_id) || 0) + 1));

  const topUsers = Array.from(countByUser.entries())
    .map(([userId, queryCount]) => ({ userId, queryCount, exceeded: queryCount > QUERY_COUNT_THRESHOLD }))
    .sort((a, b) => b.queryCount - a.queryCount);

  const payload = {
    thresholdConfig: { queryThreshold: QUERY_COUNT_THRESHOLD, periodDays: QUERY_MONITOR_PERIOD_DAYS, from: rangeFrom, to: rangeTo },
    topUsers,
    summary: { totalUsers: topUsers.length, exceededCount: topUsers.filter((u) => u.exceeded).length, totalQueries: logs.length },
  };

  const fileName = `질의빈도모니터링_${targetYear}.json`;
  const filePath = await saveEvidenceFile(`12/${departmentId}/${targetYear}/${fileName}`, generateJson(payload));

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "12", fileName, fileType: "json", filePath });
};
// authMiddleware/roleMiddleware의 authorize() 호출 실태를 옮긴 스냅샷.
// ⚠️ 라우트에 authorize()가 추가/변경되면 함께 갱신해야 한다.
// 모델/데이터 "자산" 단위 세분화 권한 테이블은 없어서 제공하지 않는다 — 필드 자체를 만들지 않는다.
const ROLE_ACCESS_SNAPSHOT = {
  note: "라우트 단위 authorize() 미들웨어 기준. 자산 단위 접근통제 매트릭스는 별도 테이블 부재로 미제공.",
  // TODO: 실제 라우트별 authorize("...") 값을 채워야 함 (grep -r "authorize(" backend/src/domains)
};

const generateEvidence23 = async ({ departmentId, targetYear, from, to }) => {
  const where = from && to ? { action_time: { [Op.between]: [from, to] } } : {};
  const actions = await ActionHistory.findAll({ where, order: [["action_time", "DESC"]], limit: 500 });

  const recentAccessLogs = actions.map((a) => ({
    actorUserId: a.actor_user_id,
    actionType: a.action_type,
    actionReason: a.action_reason,
    actionTime: a.action_time,
  }));

  const payload = { roleAccess: ROLE_ACCESS_SNAPSHOT, recentAccessLogs };
  const fileName = `접근통제현황_${targetYear}.json`;
  const filePath = await saveEvidenceFile(`23/${departmentId}/${targetYear}/${fileName}`, generateJson(payload));

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "23", fileName, fileType: "json", filePath });
};
/** ㉔ 서비스 계정 구분 필드가 없어 "자동화 계정"만 골라낼 수 없다.
 *  전체 actor_user_id 집계로 대체하고, resource/permission_level은 데이터가 없어 컬럼에서 제외했다.
 */
const generateEvidence24 = async ({ departmentId, targetYear, from, to }) => {
  const where = from && to ? { action_time: { [Op.between]: [from, to] } } : {};
  const actions = await ActionHistory.findAll({ where });

  const byActor = new Map();
  actions.forEach((a) => {
    const key = a.actor_user_id ?? "unknown";
    const entry = byActor.get(key) || { account_id: key, access_count: 0, last_access: null };
    entry.access_count += 1;
    if (!entry.last_access || a.action_time > entry.last_access) entry.last_access = a.action_time;
    byActor.set(key, entry);
  });

  const csv = generateCsv(Array.from(byActor.values()), ["account_id", "access_count", "last_access"]);
  const fileName = `자동화접근패턴_${targetYear}.csv`;
  const filePath = await saveEvidenceFile(`24/${departmentId}/${targetYear}/${fileName}`, csv);

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "24", fileName, fileType: "csv", filePath });
};

/**
 * 사람이 직접 올린 증빙파일을 저장한다. 자동생성(upsertGeneratedEvidence)과 달리
 * source_type을 "manual"로 남겨서 화면/감사 시 자동/수동을 구분할 수 있게 한다.
 */
const uploadEvidenceItem = async ({ departmentId, targetYear, itemNo, file }) => {
  // multer가 UTF-8 파일명을 latin1로 잘못 읽어들이는 문제 보정
  // (uploadMiddleware.js의 diskStorage filename 콜백과 동일한 이유)
  const fileName = Buffer.from(file.originalname, "latin1").toString("utf8");
  const relativePath = `${itemNo}/${departmentId}/${targetYear}/${fileName}`;
  const filePath = await saveEvidenceFile(relativePath, file.buffer);

  const [row] = await EvidenceFile.findOrCreate({
    where: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
    defaults: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
  });

  row.file_name = fileName;
  row.file_type = file.mimetype;
  row.file_path = filePath;
  row.source_type = "manual";
  await row.save();

  return { itemNo, fileName, filePath, result: row.item_result ?? "미이행" };
};

const GENERATORS_BY_ITEM_NO = {
  5: generateEvidence5,
  6: generateEvidence6,
  7: generateEvidence7,
  8: generateEvidence8,
  12: generateEvidence12,
  23: generateEvidence23,
  24: generateEvidence24,
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
  uploadEvidenceItem,
};
