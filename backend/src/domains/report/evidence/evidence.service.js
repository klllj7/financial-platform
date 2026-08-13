const EvidenceFile = require("./evidenceFile.model");
const { Op } = require("sequelize");
const UsageLog = require("./usageLog.model");
const ActionHistory = require("./actionHistory.model");
const { CATEGORY_META, NA_CATEGORIES, CHECKLIST_ITEMS } = require("./checklistItems");
const {
  saveEvidenceFile,
  getEvidenceFileDownloadUrl,
  getEvidenceFileStream,
  deleteEvidenceFile,
} = require("./fileStorage");
const { generateXlsx } = require("./fileGenerators/xlsxGenerator");
const { generateDocx } = require("./fileGenerators/docxGenerator");
const archiver = require("archiver");
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

  const items = await Promise.all(CHECKLIST_ITEMS.map(async (item) => {
    const match = uploaded.find((f) => f.item_no === item.no);
    return {
      ...item,
      result: match?.item_result ?? "미이행",
      evidence: match?.file_name ? "준비완료" : "미준비",
      file: match?.file_name ?? null,
      filePath: await getEvidenceFileDownloadUrl(match?.file_path),
      secondaryFile: match?.secondary_file_name ?? null,
      secondaryFilePath: await getEvidenceFileDownloadUrl(match?.secondary_file_path),
    };
  }));

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
const RULESET_SNAPSHOT = {
  piiPatternTypes: ["resident_number", "phone_number", "account_number", "card_number", "email"],
  promptInjectionPatternCount: 13, // detector.py PROMPT_INJECTION_PATTERNS.prompt_injection 배열 길이
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

  return {
    itemNo,
    fileName,
    filePath: await getEvidenceFileDownloadUrl(filePath),
    result: row.item_result ?? "미이행",
  };
};

/** 최근 N개월(이번 달 포함)의 월별 건수를 [{month:"YYYY-MM", count}] 형태로 반환한다. */
const monthlyCounts = (rows, months, dateField = "createdAt") => {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, count: 0 });
  }
  const indexByMonth = new Map(buckets.map((b, idx) => [b.month, idx]));
  rows.forEach((row) => {
    const d = new Date(row[dateField]);
    if (Number.isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (indexByMonth.has(key)) buckets[indexByMonth.get(key)].count += 1;
  });
  return buckets;
};

/**
 * Tier B(초안생성) 항목의 수동 등록 기록을 해당 item_no의 evidence_file 행에 배열로 저장한다.
 * 항목별 신규 테이블을 두지 않고 기존 evidence_file.log_entries(JSONB)만 사용한다.
 */
const appendLogEntry = async ({ departmentId, targetYear, itemNo, entry, recordedBy }) => {
  const [row] = await EvidenceFile.findOrCreate({
    where: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
    defaults: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
  });

  const nextEntries = [...(row.log_entries || []), { ...entry, recordedBy, recordedAt: new Date() }];
  row.log_entries = nextEntries;
  await row.save();

  return nextEntries;
};

const getLogEntries = async ({ departmentId, targetYear, itemNo }) => {
  const row = await EvidenceFile.findOne({
    where: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
  });
  return row?.log_entries ?? [];
};

/*
 * 컴플라이언스 담당자는 전사 단위로 상시평가 증빙자료를 준비하는 입장이라, 이 아래
 * ⑤⑥⑦⑧ 자동생성 항목들은 위험이벤트를 특정 부서로 좁히지 않고 회사 전체를 대상으로
 * getExpandedRiskEvents({ from, to })를 그대로 호출한다(userIds 미전달 = 전체 조회).
 * (예전에는 getDepartmentUserIds(departmentId)로 담당자 본인 부서에만 좁혔으나,
 * 그러면 담당자 본인 부서 밖에서 발생한 이벤트가 증빙자료에서 통째로 누락됐다.)
 * departmentId는 여전히 EvidenceFile 저장 위치(department_id 컬럼, S3 key)에는 쓰인다.
 */

/** ⑤ 입력 정상범위 사전검토 — 룰셋 스냅샷 + 차단된 이벤트 로그, xlsx(2시트) */
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

  const rulesetRows = [
    { key: "piiPatternTypes", value: RULESET_SNAPSHOT.piiPatternTypes.join(", ") },
    { key: "promptInjectionPatternCount", value: RULESET_SNAPSHOT.promptInjectionPatternCount },
    { key: "blockTypes", value: RULESET_SNAPSHOT.blockTypes.join(", ") },
  ];

  const xlsx = await generateXlsx([
    {
      sheetName: "룰셋 요약",
      columns: [
        { header: "항목", key: "key", width: 30 },
        { header: "값", key: "value", width: 50 },
      ],
      rows: rulesetRows,
    },
    {
      sheetName: "차단 이벤트 목록",
      columns: [
        { header: "이벤트ID", key: "eventId", width: 14 },
        { header: "유형", key: "type", width: 22 },
        { header: "등급", key: "grade", width: 10 },
        { header: "발생일시", key: "createdAt", width: 22 },
        { header: "마스킹 내용", key: "maskedDescription", width: 50 },
      ],
      rows: blockedEvents,
    },
  ]);

  const fileName = `입력검증룰셋_설정_${targetYear}.xlsx`;
  const relativePath = `5/${departmentId}/${targetYear}/${fileName}`;
  const filePath = await saveEvidenceFile(relativePath, xlsx);

  return upsertGeneratedEvidence({
    departmentId, targetYear, itemNo: "5",
    fileName, fileType: "xlsx", filePath,
  });
};

/** ⑥ 우회시도 탐지·차단 — prompt_injection 유형만, xlsx */
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

  const xlsx = await generateXlsx([
    {
      sheetName: "탈옥탐지로그",
      columns: [
        { header: "이벤트ID", key: "event_id", width: 14 },
        { header: "발생일시", key: "created_at", width: 22 },
        { header: "등급", key: "grade", width: 10 },
        { header: "처리상태", key: "action_status", width: 12 },
        { header: "마스킹 내용", key: "masked_description", width: 50 },
      ],
      rows: filtered,
    },
  ]);

  const fileName = `탈옥탐지로그_${targetYear}.xlsx`;
  const relativePath = `6/${departmentId}/${targetYear}/${fileName}`;
  const filePath = await saveEvidenceFile(relativePath, xlsx);

  return upsertGeneratedEvidence({
    departmentId, targetYear, itemNo: "6",
    fileName, fileType: "xlsx", filePath,
  });
};

/** ⑦ PII 탐지·마스킹 — PII 유형만, xlsx */
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

  const xlsx = await generateXlsx([
    {
      sheetName: "PII마스킹이벤트로그",
      columns: [
        { header: "이벤트ID", key: "event_id", width: 14 },
        { header: "발생일시", key: "created_at", width: 22 },
        { header: "유형", key: "type", width: 20 },
        { header: "등급", key: "grade", width: 10 },
        { header: "처리상태", key: "action_status", width: 12 },
        { header: "마스킹 내용", key: "masked_description", width: 50 },
      ],
      rows: filtered,
    },
  ]);

  const fileName = `PII마스킹이벤트로그_${targetYear}.xlsx`;
  const relativePath = `7/${departmentId}/${targetYear}/${fileName}`;
  const filePath = await saveEvidenceFile(relativePath, xlsx);

  return upsertGeneratedEvidence({
    departmentId, targetYear, itemNo: "7",
    fileName, fileType: "xlsx", filePath,
  });
};

/** ⑧ 출력·에러메시지 내 기밀정보 노출 방지 — xlsx
 *  AI 응답에서 탐지된 건(direction="output") 전부와, 입력 단계의 confidential_similarity를 싣는다.
 *  event_log.direction 컬럼이 생기기 전에는 출력 탐지를 구분할 방법이 없어서
 *  유사도 유형만 넣고 스펙의 "output_leak_block" 태깅을 제외했었다. 이제 구분이 가능하다.
 */
const generateEvidence8 = async ({ departmentId, targetYear, from, to }) => {
  const rows = await getExpandedRiskEvents({ from, to });
  const filtered = rows
    .filter((r) => r.direction === "output" || r.type === "confidential_similarity")
    .map((r) => ({
      event_id: r.eventId,
      created_at: r.createdAt,
      direction: r.direction,
      type: r.type,
      grade: r.grade,
      action_status: r.actionStatus,
      masked_description: r.maskedDescription,
    }));

  const xlsx = await generateXlsx([
    {
      sheetName: "기밀정보노출차단로그",
      columns: [
        { header: "이벤트ID", key: "event_id", width: 14 },
        { header: "발생일시", key: "created_at", width: 22 },
        // 입력(사용자 프롬프트)에서 탐지된 건인지 출력(AI 응답)에서 탐지된 건인지.
        // ⑧번 항목이 요구하는 "출력 노출 방지" 증빙의 핵심 구분자다.
        { header: "탐지위치", key: "direction", width: 12 },
        { header: "유형", key: "type", width: 22 },
        { header: "등급", key: "grade", width: 10 },
        { header: "처리상태", key: "action_status", width: 12 },
        { header: "마스킹 내용", key: "masked_description", width: 50 },
      ],
      rows: filtered,
    },
  ]);

  const fileName = `기밀정보노출차단로그_${targetYear}.xlsx`;
  const filePath = await saveEvidenceFile(`8/${departmentId}/${targetYear}/${fileName}`, xlsx);

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "8", fileName, fileType: "xlsx", filePath });
};


const generateEvidence12 = async ({ departmentId, targetYear, from, to }) => {
  const rangeTo = to ?? new Date();
  const rangeFrom = from ?? new Date(rangeTo.getTime() - QUERY_MONITOR_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  // ⑤⑥⑦⑧/23/24와 같은 이유로 부서로 좁히지 않고 전사 사용자를 대상으로 한다.
  const logs = await UsageLog.findAll({
    attributes: ["user_id", "created_at"],
    where: { created_at: { [Op.between]: [rangeFrom, rangeTo] } },
  });

  const countByUser = new Map();
  logs.forEach((l) => countByUser.set(l.user_id, (countByUser.get(l.user_id) || 0) + 1));

  const topUsers = Array.from(countByUser.entries())
    .map(([userId, queryCount]) => ({ userId, queryCount, exceeded: queryCount > QUERY_COUNT_THRESHOLD }))
    .sort((a, b) => b.queryCount - a.queryCount);

  const summaryRows = [
    { key: "질의건수 임계치", value: QUERY_COUNT_THRESHOLD },
    { key: "모니터링 기간(일)", value: QUERY_MONITOR_PERIOD_DAYS },
    { key: "조회기간 시작", value: rangeFrom },
    { key: "조회기간 종료", value: rangeTo },
    { key: "전체 사용자수", value: topUsers.length },
    { key: "임계치 초과 사용자수", value: topUsers.filter((u) => u.exceeded).length },
    { key: "전체 질의건수", value: logs.length },
  ];

  const xlsx = await generateXlsx([
    {
      sheetName: "요약",
      columns: [
        { header: "항목", key: "key", width: 26 },
        { header: "값", key: "value", width: 26 },
      ],
      rows: summaryRows,
    },
    {
      sheetName: "사용자별 질의건수",
      columns: [
        { header: "사용자ID", key: "userId", width: 14 },
        { header: "질의건수", key: "queryCount", width: 14 },
        { header: "임계치 초과여부", key: "exceeded", width: 16 },
      ],
      rows: topUsers,
    },
  ]);

  const fileName = `질의빈도모니터링_${targetYear}.xlsx`;
  const filePath = await saveEvidenceFile(`12/${departmentId}/${targetYear}/${fileName}`, xlsx);

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "12", fileName, fileType: "xlsx", filePath });
};
// authMiddleware/roleMiddleware의 authorize() 호출 실태를 옮긴 스냅샷.
// ⚠️ 라우트에 authorize()가 추가/변경되면 함께 갱신해야 한다.
// 모델/데이터 "자산" 단위 세분화 권한 테이블은 없어서 제공하지 않는다 — 필드 자체를 만들지 않는다.
const ROLE_ACCESS_SNAPSHOT = {
  note: "라우트 단위 authorize() 미들웨어 기준. 자산 단위 접근통제 매트릭스는 별도 테이블 부재로 미제공.",
  // TODO: 실제 라우트별 authorize("...") 값을 채워야 함 (grep -r "authorize(" backend/src/domains)
};

/*
 * 23/24번도 ⑤⑥⑦⑧과 같은 이유로 부서로 좁히지 않고 전사 ActionHistory를 그대로 쓴다.
 * (예전엔 getDepartmentUsageLogIds(departmentId)로 요청 소유자의 부서 소속 여부를 거쳐
 * event_id를 좁혔으나, 컴플라이언스 담당자 본인 부서 밖 조치 이력이 누락됐다.)
 */
const generateEvidence23 = async ({ departmentId, targetYear, from, to }) => {
  const where = from && to ? { action_time: { [Op.between]: [from, to] } } : {};
  const actions = await ActionHistory.findAll({ where, order: [["action_time", "DESC"]], limit: 500 });

  const recentAccessLogs = actions.map((a) => ({
    actorUserId: a.actor_user_id,
    actionType: a.action_type,
    actionReason: a.action_reason,
    actionTime: a.action_time,
  }));

  const xlsx = await generateXlsx([
    {
      sheetName: "접근통제 안내",
      columns: [{ header: "안내", key: "note", width: 80 }],
      rows: [{ note: ROLE_ACCESS_SNAPSHOT.note }],
    },
    {
      sheetName: "최근 접근이력",
      columns: [
        { header: "행위자ID", key: "actorUserId", width: 14 },
        { header: "행위유형", key: "actionType", width: 20 },
        { header: "사유", key: "actionReason", width: 30 },
        { header: "발생일시", key: "actionTime", width: 22 },
      ],
      rows: recentAccessLogs,
    },
  ]);
  const fileName = `접근통제현황_${targetYear}.xlsx`;
  const filePath = await saveEvidenceFile(`23/${departmentId}/${targetYear}/${fileName}`, xlsx);

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "23", fileName, fileType: "xlsx", filePath });
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

  const xlsx = await generateXlsx([
    {
      sheetName: "자동화접근패턴",
      columns: [
        { header: "계정ID", key: "account_id", width: 14 },
        { header: "접근횟수", key: "access_count", width: 14 },
        { header: "최근접근일시", key: "last_access", width: 22 },
      ],
      rows: Array.from(byActor.values()),
    },
  ]);
  const fileName = `자동화접근패턴_${targetYear}.xlsx`;
  const filePath = await saveEvidenceFile(`24/${departmentId}/${targetYear}/${fileName}`, xlsx);

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo: "24", fileName, fileType: "xlsx", filePath });
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

  return {
    itemNo,
    fileName,
    filePath: await getEvidenceFileDownloadUrl(filePath),
    result: row.item_result ?? "미이행",
  };
};

/** 업로드/생성된 증빙파일을 삭제한다. S3 객체(주/보조 파일 둘 다)와 DB의 파일 관련 필드를 함께 지운다. */
const deleteEvidenceItem = async ({ departmentId, targetYear, itemNo }) => {
  const row = await EvidenceFile.findOne({
    where: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
  });

  if (!row || !row.file_path) {
    throw serviceError("EVIDENCE_FILE_NOT_FOUND", "삭제할 증빙파일이 없습니다.", 404);
  }

  await Promise.all([
    deleteEvidenceFile(row.file_path),
    deleteEvidenceFile(row.secondary_file_path),
  ]);

  row.file_name = null;
  row.file_type = null;
  row.file_path = null;
  row.secondary_file_name = null;
  row.secondary_file_type = null;
  row.secondary_file_path = null;
  row.source_type = null;
  row.draft_content = null;
  row.edited_content = null;
  row.is_edited = false;
  row.item_result = null;
  await row.save();

  return { itemNo, result: "미이행" };
};

/** "전체 자료 다운로드" 탭 — 체크리스트 현황 1시트 xlsx */
const exportChecklistXlsx = async ({ departmentId, targetYear }) => {
  const { items } = await getEvidenceChecklist({ departmentId, targetYear });
  const uploaded = await EvidenceFile.findAll({
    where: { department_id: departmentId, target_year: targetYear },
  });
  const updatedAtByItemNo = new Map(uploaded.map((f) => [f.item_no, f.updatedAt]));

  const rows = items.map((item) => ({
    no: item.no,
    title: item.title,
    category: item.category,
    result: item.result,
    file: item.file ?? "",
    updatedAt: updatedAtByItemNo.get(item.no) ?? "",
  }));

  const xlsx = await generateXlsx([
    {
      sheetName: "증빙자료 체크리스트",
      columns: [
        { header: "번호", key: "no", width: 8 },
        { header: "항목명", key: "title", width: 50 },
        { header: "대분류", key: "category", width: 12 },
        { header: "결과", key: "result", width: 12 },
        { header: "증빙파일명", key: "file", width: 40 },
        { header: "제출일", key: "updatedAt", width: 22 },
      ],
      rows,
    },
  ]);

  return { fileName: `증빙자료_체크리스트_${targetYear}.xlsx`, buffer: xlsx };
};

/** "전체 자료 다운로드" 탭 — 업로드/생성된 증빙파일 전체를 zip으로 스트리밍 */
const exportEvidenceZip = async ({ departmentId, targetYear, res }) => {
  const uploaded = await EvidenceFile.findAll({
    where: { department_id: departmentId, target_year: targetYear },
  });

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  const filesToZip = uploaded.filter((f) => f.file_path && f.file_name);
  for (const f of filesToZip) {
    // S3 마이그레이션 이전에 만들어진 레코드는 file_path가 옛날 로컬 경로 형식이라
    // S3에 해당 key가 없을 수 있다. 파일 하나가 없다고 zip 전체를 실패시키지 않고
    // 그 파일만 건너뛴다.
    try {
      const stream = await getEvidenceFileStream(f.file_path);
      archive.append(stream, { name: `${f.item_no}_${f.file_name}` });
    } catch (error) {
      console.error(`증빙파일 zip 포함 실패 (item_no=${f.item_no}, key=${f.file_path}):`, error.message);
    }
  }

  await archive.finalize();
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

const formatDate = (date) => (date ? new Date(date).toISOString().slice(0, 10) : null);

/** ⑨ 회피공격 방어체계 — prompt_injection 최근 12개월 추이 + 룰셋 패턴 수, 초안(통계+서술) */
const buildDraft9 = async ({ departmentId, targetYear }) => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const rows = (await getExpandedRiskEvents({ from, to: now })).filter((r) => r.type === "prompt_injection");
  const monthly = monthlyCounts(rows, 12);
  const guardModelName = process.env.GUARD_MODEL_NAME || "[가드모델명 입력]";

  const narrative = [
    `당사는 정규식 기반 1차 필터링(${RULESET_SNAPSHOT.promptInjectionPatternCount}개 패턴)과 ${guardModelName} 기반 2차 검증의 방어체계를 운영 중이며, 최근 12개월간 총 ${rows.length}건의 프롬프트 인젝션 시도를 탐지·차단함.`,
    "해당없음 — 생성형 AI 서비스만 운영, 판단형 모델(분류/스코어링 모델) 별도 미보유. 판단형 모델을 운영하게 될 경우 적대적예제 방어체계를 별도로 기술함.",
  ].join("\n");

  return {
    stats: {
      promptInjectionPatternCount: RULESET_SNAPSHOT.promptInjectionPatternCount,
      guardModelName,
      totalCount: rows.length,
      monthly,
    },
    narrative,
  };
};

/** ⑪ 실시간 위협 모니터링 체계 — 전체 위험이벤트 최근 6개월 추이, 초안(통계+서술) */
const buildDraft11 = async ({ departmentId, targetYear }) => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const rows = await getExpandedRiskEvents({ from, to: now });
  const monthly = monthlyCounts(rows, 6);
  const avgPerMonth = Math.round((rows.length / 6) * 10) / 10;
  const alertChannelName = process.env.ALERT_CHANNEL_NAME || "[알림채널 입력]";

  const narrative = [
    `AI 시스템 보안 이벤트는 최근 6개월간 총 ${rows.length}건, 월평균 ${avgPerMonth}건이 실시간으로 로깅되며, 임계치 초과 시 ${alertChannelName}로 자동 통보됨.`,
    "에스컬레이션 절차 및 담당자 지정 등 운영절차는 아래에 직접 기술하십시오.",
  ].join("\n");

  return {
    stats: { totalCount: rows.length, avgPerMonth, alertChannelName, monthly },
    narrative,
  };
};

/** ⑰ 오픈모델 사전검증 — model_hash_log 성격의 log_entries(item 17) 존재 여부로 자체호스팅 여부를 판단 */
const buildDraft17 = async ({ departmentId, targetYear }) => {
  const entries = await getLogEntries({ departmentId, targetYear, itemNo: "17" });

  if (entries.length === 0) {
    return {
      stats: { verifiedCount: 0 },
      narrative: "자체 호스팅 모델 없음 — 해당없음. 외부 API 기반 모델만 사용 중이며 별도 해시 검증 대상이 없음.",
    };
  }

  const lastVerifiedAt = entries.reduce(
    (latest, e) => (!latest || new Date(e.verifiedAt) > new Date(latest) ? e.verifiedAt : latest),
    null
  );

  return {
    stats: { verifiedCount: entries.length, lastVerifiedAt: formatDate(lastVerifiedAt), entries },
    narrative: [
      `${entries.length}개 모델에 대해 도입 시 SHA-256 해시값 검증을 수행함(최근 검증일: ${formatDate(lastVerifiedAt)}).`,
      "검증절차 및 취약점 확인 절차는 아래에 직접 기술하십시오.",
    ].join("\n"),
  };
};

/** ⑲ 외부데이터 오염공격 위협평가 — item 19 log_entries 기반 */
const buildDraft19 = async ({ departmentId, targetYear }) => {
  const entries = await getLogEntries({ departmentId, targetYear, itemNo: "19" });

  if (entries.length === 0) {
    return {
      stats: { checkedCount: 0 },
      narrative:
        "이상치 탐지 이력 없음 — 외부데이터 오염공격 위협평가를 위해 등록된 점검 이력이 없습니다. 최초 점검 시 아래 등록 폼을 통해 기록하십시오.",
    };
  }

  const lastCheckedAt = entries.reduce(
    (latest, e) => (!latest || new Date(e.checkedAt) > new Date(latest) ? e.checkedAt : latest),
    null
  );

  return {
    stats: { checkedCount: entries.length, lastCheckedAt: formatDate(lastCheckedAt), entries },
    narrative: [
      `${entries.length}건의 데이터 소스에 대해 오염공격 여부 이상치 탐지를 수행함(최근 점검일: ${formatDate(lastCheckedAt)}).`,
      "상세 위협평가 결과는 아래에 직접 기술하십시오.",
    ].join("\n"),
  };
};

/** ㉞ 모델·데이터 업데이트 영향평가 — item 34 log_entries 기반 */
const buildDraft34 = async ({ departmentId, targetYear }) => {
  const entries = await getLogEntries({ departmentId, targetYear, itemNo: "34" });

  if (entries.length === 0) {
    return {
      stats: { changeCount: 0 },
      narrative: `${targetYear}년 등록된 모델·데이터 변경 이력이 없습니다. 변경 발생 시 아래 등록 폼을 통해 기록하십시오.`,
    };
  }

  return {
    stats: { changeCount: entries.length, entries },
    narrative: [
      `${targetYear}년 총 ${entries.length}건의 모델/데이터 변경이 있었으며, 변경 시 보안영향평가를 수행함.`,
      "평가결과 상세(영향도, 조치사항)는 아래에 직접 기술하십시오.",
    ].join("\n"),
  };
};

const DRAFT_GENERATORS_BY_ITEM_NO = {
  9: buildDraft9,
  11: buildDraft11,
  17: buildDraft17,
  19: buildDraft19,
  34: buildDraft34,
};

/** Tier B 초안 확정 — 통계는 xlsx로, 서술은 docx로 각각 만들어 같은 evidence_file 행에 저장한다(2파일). */
const confirmDraft = async ({ departmentId, targetYear, itemNo, draftContent, editedContent, stats, isEdited }) => {
  const item = CHECKLIST_ITEMS.find((i) => i.no === itemNo);
  const title = item?.title ?? `항목 ${itemNo}`;

  const summaryRows = Object.entries(stats)
    .filter(([key]) => key !== "entries" && key !== "monthly")
    .map(([key, value]) => ({ key, value: Array.isArray(value) ? value.join(", ") : String(value ?? "") }));

  const sheets = [
    {
      sheetName: "요약",
      columns: [
        { header: "항목", key: "key", width: 26 },
        { header: "값", key: "value", width: 40 },
      ],
      rows: summaryRows,
    },
  ];

  if (Array.isArray(stats.monthly)) {
    sheets.push({
      sheetName: "월별 추이",
      columns: [
        { header: "월", key: "month", width: 12 },
        { header: "건수", key: "count", width: 10 },
      ],
      rows: stats.monthly,
    });
  }

  if (Array.isArray(stats.entries) && stats.entries.length) {
    const entryColumns = Object.keys(stats.entries[0]).map((key) => ({ header: key, key, width: 20 }));
    sheets.push({ sheetName: "등록 기록", columns: entryColumns, rows: stats.entries });
  }

  const xlsx = await generateXlsx(sheets);
  const docx = await generateDocx(title, [{ paragraphs: editedContent.split("\n").filter(Boolean) }]);

  const xlsxFileName = `${title}_통계_${targetYear}.xlsx`;
  const docxFileName = `${title}_서술_${targetYear}.docx`;
  const xlsxPath = await saveEvidenceFile(`${itemNo}/${departmentId}/${targetYear}/${xlsxFileName}`, xlsx);
  const docxPath = await saveEvidenceFile(`${itemNo}/${departmentId}/${targetYear}/${docxFileName}`, docx);

  const [row] = await EvidenceFile.findOrCreate({
    where: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
    defaults: { department_id: departmentId, target_year: targetYear, item_no: itemNo },
  });

  row.file_name = xlsxFileName;
  row.file_type = "xlsx";
  row.file_path = xlsxPath;
  row.secondary_file_name = docxFileName;
  row.secondary_file_type = "docx";
  row.secondary_file_path = docxPath;
  row.draft_content = draftContent;
  row.edited_content = editedContent;
  row.is_edited = Boolean(isEdited);
  row.source_type = "draft";
  await row.save();

  return {
    itemNo,
    fileName: xlsxFileName,
    filePath: await getEvidenceFileDownloadUrl(xlsxPath),
    secondaryFileName: docxFileName,
    secondaryFilePath: await getEvidenceFileDownloadUrl(docxPath),
    result: row.item_result ?? "미이행",
  };
};

/** Tier D 서술형 템플릿(LMS/SBOM 등 연동이 없어 자동 통계를 만들 수 없는 항목) — 빈 양식 docx만 생성 */
const buildManualTemplate = async ({ departmentId, targetYear, itemNo, guideNote }) => {
  const item = CHECKLIST_ITEMS.find((i) => i.no === itemNo);
  const title = item?.title ?? `항목 ${itemNo}`;

  const previousYear = await EvidenceFile.findOne({
    where: { department_id: departmentId, target_year: targetYear - 1, item_no: itemNo },
  });

  const sections = [
    {
      heading: "안내서 근거",
      paragraphs: [
        guideNote,
        "※ 안내서 발췌 원문은 컴플라이언스팀이 추후 기재.",
      ],
    },
  ];

  if (previousYear?.file_name) {
    sections.push({
      heading: "전년도 자료 참고",
      paragraphs: [`전년도(${targetYear - 1}) 등록 파일: ${previousYear.file_name}`],
    });
  }

  sections.push({
    heading: "작성 안내",
    paragraphs: ["아래에 실제 이행 내용을 직접 서술한 뒤, 이 문서를 저장하여 다시 업로드하십시오.", ""],
  });

  const docx = await generateDocx(title, sections);
  const fileName = `${title}_${targetYear}.docx`;
  const filePath = await saveEvidenceFile(`${itemNo}/${departmentId}/${targetYear}/${fileName}`, docx);

  return upsertGeneratedEvidence({ departmentId, targetYear, itemNo, fileName, fileType: "docx", filePath });
};

const buildTemplate28 = (args) =>
  buildManualTemplate({
    ...args,
    itemNo: "28",
    guideNote: "AI 특화 보안위협 교육 실시 이력 및 계획을 기술하는 항목. HR/LMS 연동이 없어 자동 통계는 제공하지 않음.",
  });

const buildTemplate37 = (args) =>
  buildManualTemplate({
    ...args,
    itemNo: "37",
    guideNote: "오픈소스 AI 도구 라이선스·취약점·업데이트 관리 현황을 기술하는 항목. SBOM 스캐너 연동이 없어 자동 통계는 제공하지 않음.",
  });

const TEMPLATE_GENERATORS_BY_ITEM_NO = {
  28: buildTemplate28,
  37: buildTemplate37,
};

const generateEvidenceItem = async ({ departmentId, targetYear, itemNo, from, to }) => {
  const draftBuilder = DRAFT_GENERATORS_BY_ITEM_NO[itemNo];
  if (draftBuilder) {
    const { stats, narrative } = await draftBuilder({ departmentId, targetYear, from, to });
    return { isDraft: true, itemNo, stats, narrative };
  }

  const generator = GENERATORS_BY_ITEM_NO[itemNo] || TEMPLATE_GENERATORS_BY_ITEM_NO[itemNo];
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
  deleteEvidenceItem,
  exportChecklistXlsx,
  exportEvidenceZip,
  appendLogEntry,
  confirmDraft,
};
