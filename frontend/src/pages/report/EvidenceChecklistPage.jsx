import { useEffect, useMemo, useState, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  FileText,
  Upload,
  Sparkles,
  Circle,
  Download,
  FileArchive,
  FileCheck2,
  Trash2,
  BarChart3,
  ListChecks,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getEvidenceChecklist,
  updateEvidenceItemResult,
  generateEvidenceItem,
  uploadEvidenceItem,
  deleteEvidenceItem,
  exportEvidenceChecklistXlsx,
  exportEvidenceZip,
  addEvidenceLogEntry,
  confirmEvidenceDraft,
} from "../../api/reportApi";

import "./EvidenceChecklistPage.css";

export function progressTone(pct) {
  if (pct >= 80) return "ce-tone-good";
  if (pct >= 50) return "ce-tone-mid";
  return "ce-tone-low";
}

export function resultBadgeClass(result) {
  const map = {
    이행: "ce-badge ce-badge-done",
    부분이행: "ce-badge ce-badge-partial",
    미이행: "ce-badge ce-badge-none",
    해당없음: "ce-badge ce-badge-na",
  };
  return map[result] || "ce-badge ce-badge-na";
}

// 백엔드(evidence.service.js)의 GENERATORS_BY_ITEM_NO/DRAFT_GENERATORS_BY_ITEM_NO/
// TEMPLATE_GENERATORS_BY_ITEM_NO와 반드시 동기화해야 한다. 여기 없는 번호는 업로드(수동) 방식.
// - auto: 로그 기반으로 파일을 완전자동 생성(기존 방식)
// - draft: 통계는 자동 집계, 서술은 사람이 편집 후 확정(xlsx+docx 2파일)
// - template: LMS/SBOM 등 연동이 없어 통계 없이 docx 빈 양식만 생성, 재업로드로 최종 완료
const ITEM_GENERATION_MODE = {
  5: "auto", 6: "auto", 7: "auto", 8: "auto", 12: "auto", 23: "auto", 24: "auto",
  9: "draft", 11: "draft", 17: "draft", 19: "draft", 34: "draft",
  28: "template", 37: "template",
};
const getGenerationMode = (no) => ITEM_GENERATION_MODE[no] ?? "upload";

// 항목 17/19/34 초안 모달에서 제공하는 "+ 기록 추가" 인라인 폼의 항목별 필드 정의.
const LOG_ENTRY_FIELDS = {
  17: [
    { key: "modelName", label: "모델명", type: "text" },
    { key: "version", label: "버전", type: "text" },
    { key: "sha256", label: "SHA-256 해시", type: "text" },
    { key: "verifiedAt", label: "검증일", type: "date" },
  ],
  19: [
    { key: "dataSourceName", label: "데이터 소스명", type: "text" },
    { key: "checkedAt", label: "점검일", type: "date" },
    { key: "anomalyType", label: "이상 유형", type: "text" },
    { key: "actionTaken", label: "조치사항", type: "text" },
  ],
  34: [
    { key: "modelName", label: "모델/데이터명", type: "text" },
    { key: "changeType", label: "변경 유형", type: "text" },
    { key: "changedAt", label: "변경일", type: "date" },
    { key: "description", label: "설명", type: "text" },
  ],
};

// 상시평가 대상연도. 현재는 화면 문구("2026년 자체평가")와 동일하게 고정값으로 둔다.
const TARGET_YEAR = 2026;

// 대분류 라벨은 "① 동의원칙", "⑦ 관리적 보호조치"처럼 원문자(①~⑨, U+2460~U+2468)로 시작한다.
// 이 원문자를 숫자로 변환해 대항목 번호 오름차순 정렬에 사용한다.
const parseCircledNumber = (label) => {
  const code = label?.codePointAt(0);
  if (code === undefined || code < 0x2460 || code > 0x2468) return Number.MAX_SAFE_INTEGER;
  return code - 0x2460 + 1;
};

const sortByCircledNumber = (list) =>
  [...list].sort((a, b) => parseCircledNumber(a.label ?? a) - parseCircledNumber(b.label ?? b));

// 사이드바(Sidebar.jsx)와 동일한 방식으로 로그인 사용자 정보를 안전하게 읽어온다.
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

function EvidenceChecklistPage() {
  const [items, setItems] = useState([]);
  // 카테고리 메타/해당없음 목록은 더 이상 프론트 mock이 아니라 getEvidenceChecklist API 응답
  // (categoryMeta/naCategories 필드, backend checklistItems.js가 source of truth)에서 받는다.
  const [categoryMeta, setCategoryMeta] = useState([]);
  const [naCategories, setNaCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // categoryMeta가 API 응답 이후에야 채워지므로, 아코디언 펼침 상태도 그때 함께 초기화한다.
  const [expanded, setExpanded] = useState({});
  const [naExpanded, setNaExpanded] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  // 항목명을 클릭하면 열리는 "이 항목은 무엇을 점검하나요?" 사이드바 대상 (없으면 닫힘)
  const [detailTarget, setDetailTarget] = useState(null);
  const [filterCategory, setFilterCategory] = useState("전체");
  const [filterResult, setFilterResult] = useState("전체");
  const [filterEvidence, setFilterEvidence] = useState("전체");
  const [activeTab, setActiveTab] = useState("detail");

  // 팝업을 띄운 대상 항목 (없으면 팝업 닫힘). "생성"/"업로드" 버튼 또는 결과 배지 클릭으로 연다.
  const [generateTarget, setGenerateTarget] = useState(null);
  // "confirm-generate": 실제 생성 실행 단계(자동생성 항목만) / "pick-result": 이행·부분이행·미이행 선택 단계
  const [modalStep, setModalStep] = useState("pick-result");
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  // draft(Tier B) 모달 전용 상태. draftData.narrative는 서버가 만든 원본 초안,
  // draftNarrative는 사용자가 textarea에서 편집 중인 값이다(둘이 다르면 isEdited=true로 확정).
  const [draftData, setDraftData] = useState(null);
  const [draftNarrative, setDraftNarrative] = useState("");
  const [logEntryFormOpen, setLogEntryFormOpen] = useState(false);
  const [logEntryValues, setLogEntryValues] = useState({});
  const [logEntrySaving, setLogEntrySaving] = useState(false);

  // 업로드(수동) 항목용. 숨겨둔 <input type="file">을 코드로 클릭시켜 파일 선택창을 띄운다.
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingItemNo, setDeletingItemNo] = useState(null);

  // "평가결과 요약" 탭에서 미제출 항목을 클릭했을 때, 상세 탭으로 이동해 해당 행을 잠깐 강조한다.
  const [highlightItemNo, setHighlightItemNo] = useState(null);
  const [exporting, setExporting] = useState(null); // "xlsx" | "zip" | null

  const departmentId = getStoredUser()?.department?.id ?? null;

  useEffect(() => {
    if (!departmentId) {
      setError("소속 부서 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      setLoading(false);
      return;
    }

    getEvidenceChecklist({ departmentId, targetYear: TARGET_YEAR })
      .then((res) => {
        const sortedCategoryMeta = sortByCircledNumber(res.data.categoryMeta);
        setItems(res.data.items);
        setCategoryMeta(sortedCategoryMeta);
        setNaCategories(sortByCircledNumber(res.data.naCategories));
        setExpanded(Object.fromEntries(sortedCategoryMeta.map((c) => [c.key, true])));
      })
      .catch((err) => {
        console.error("증빙자료 목록 조회 실패", err);
        setError("증빙자료 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [departmentId]);

  // 항목번호 표시 재설계: 순차번호(1~38, API 원본 순서 기준)를 주 번호로 쓰고, 원문 항목번호
  // (item.no)는 원문자 보조배지로만 보여준다. item.no 자체는 필터와 무관하게 API 호출/매핑에 계속 그대로 쓴다.
  const displayOrderByNo = useMemo(
    () => new Map(items.map((item, idx) => [item.no, idx + 1])),
    [items]
  );

  const totalItems = items.length;
  const totalPrepared = items.filter((i) => i.evidence === "준비완료").length;
  const overallPct = totalItems ? Math.round((totalPrepared / totalItems) * 100) : 0;

  const filteredItems = (list) =>
    list.filter(
      (i) =>
        (filterResult === "전체" || i.result === filterResult) &&
        (filterEvidence === "전체" || i.evidence === filterEvidence)
    );

  const visibleCategories =
    filterCategory === "전체"
      ? categoryMeta
      : categoryMeta.filter((c) => c.key === filterCategory);

  // 팝업을 닫고 상태를 초기화한다 (모달을 다시 열 때 이전 단계가 남아있지 않도록).
  const closeModal = () => {
    if (saving) return;
    setGenerateError(null);
    setGenerateTarget(null);
    setDraftData(null);
    setDraftNarrative("");
    setLogEntryFormOpen(false);
    setLogEntryValues({});
  };

  // "생성" 버튼 클릭. auto/template 항목 모두 이 단계를 공유하고, 실제 실행 핸들러만
  // 아래 confirm-generate 단계 렌더링에서 항목 모드에 따라 분기한다.
  const openGenerateModal = (item) => {
    setGenerateError(null);
    setModalStep("confirm-generate");
    setGenerateTarget(item);
  };

  // "초안 생성"/"초안 재생성" 클릭. 통계+서술 초안을 먼저 서버에서 받아와야 하므로
  // 로딩 단계(draft-loading)를 거친 뒤 draft-edit으로 넘어간다.
  const openDraftModal = async (item) => {
    setGenerateError(null);
    setDraftData(null);
    setDraftNarrative("");
    setLogEntryFormOpen(false);
    setLogEntryValues({});
    setModalStep("draft-loading");
    setGenerateTarget(item);

    try {
      const res = await generateEvidenceItem({ departmentId, targetYear: TARGET_YEAR, itemNo: item.no });
      setDraftData(res.data);
      setDraftNarrative(res.data.narrative);
      setModalStep("draft-edit");
    } catch (err) {
      console.error("초안 생성 실패", err);
      setGenerateError(err.response?.data?.error?.message || "초안 생성에 실패했습니다.");
    }
  };

  // 결과 배지를 클릭했을 때. 이미 준비된 항목이든 아니든, 결과값만 바로 수정할 수 있게 한다.
  const openEditResultModal = (item) => {
    setGenerateError(null);
    setModalStep("pick-result");
    setGenerateTarget(item);
  };

  // 결과 배지 클릭으로 열었을 때, 또는 자동생성/업로드 직후 결과를 확정할 때 쓴다.
  // evidence/file은 이미 올바른 값이 들어있으므로 result만 바꾼다.
  const handleResultOnlyUpdate = async (resultValue) => {
    if (!generateTarget || !departmentId) return;

    setSaving(true);
    try {
      await updateEvidenceItemResult({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
        result: resultValue,
      });

      setItems((prev) =>
        prev.map((i) => (i.no === generateTarget.no ? { ...i, result: resultValue } : i))
      );
      setGenerateTarget(null);
    } catch (err) {
      console.error("결과 저장 실패", err);
      alert("결과 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /*
    ⑤⑥⑦번처럼 백엔드가 실제로 자동생성을 지원하는 항목은 실제 탐지 로그 기반으로
    파일을 만든다. 결과값(이행/부분이행/미이행)은 여기서 자동으로 정하지 않고,
    생성이 끝나면 pick-result 단계로 넘어가 사람이 직접 고르게 한다
    (기본값은 "미이행" — backend upsertGeneratedEvidence 참고).
  */
  const handleAutoGenerate = async () => {
    if (!generateTarget || !departmentId) return;

    setSaving(true);
    setGenerateError(null);
    try {
      const res = await generateEvidenceItem({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
      });
      const { fileName, filePath, result } = res.data;

      setItems((prev) =>
        prev.map((i) =>
          i.no === generateTarget.no
            ? { ...i, evidence: "준비완료", file: fileName, filePath, result }
            : i
        )
      );
      setModalStep("pick-result");
    } catch (err) {
      console.error("증빙자료 생성 실패", err);
      setGenerateError(
        err.response?.data?.error?.message || "증빙자료 생성에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
    ㉘/㊲번처럼 LMS·SBOM 등 연동이 없어 자동 통계를 만들 수 없는 항목은 빈 docx 양식만
    받는다. auto와 달리 결과선택 단계로 넘기지 않고 모달을 바로 닫는다 — 사용자가 Word에서
    내용을 채운 뒤 기존 업로드 버튼으로 재업로드해야 최종 완료되는 흐름이기 때문이다.
  */
  const handleTemplateGenerate = async () => {
    if (!generateTarget || !departmentId) return;

    setSaving(true);
    setGenerateError(null);
    try {
      const res = await generateEvidenceItem({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
      });
      const { fileName, filePath, result } = res.data;

      setItems((prev) =>
        prev.map((i) =>
          i.no === generateTarget.no
            ? { ...i, evidence: "준비완료", file: fileName, filePath, result }
            : i
        )
      );
      setGenerateTarget(null);
    } catch (err) {
      console.error("템플릿 생성 실패", err);
      setGenerateError(
        err.response?.data?.error?.message || "템플릿 생성에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  // 항목 17/19/34 초안 모달의 "+ 기록 추가" 폼 저장. 등록 후에는 방금 등록한 기록이
  // 반영되도록 초안을 다시 생성해 통계/서술을 갱신한다(편집 중이던 서술은 새 초안으로 대체됨).
  const handleSaveLogEntry = async () => {
    if (!generateTarget || !departmentId) return;

    setLogEntrySaving(true);
    try {
      await addEvidenceLogEntry({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
        entry: logEntryValues,
      });

      const res = await generateEvidenceItem({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
      });
      setDraftData(res.data);
      setDraftNarrative(res.data.narrative);
      setLogEntryFormOpen(false);
      setLogEntryValues({});
    } catch (err) {
      console.error("기록 등록 실패", err);
      alert(err.response?.data?.error?.message || "기록 등록에 실패했습니다.");
    } finally {
      setLogEntrySaving(false);
    }
  };

  // 초안 모달의 "확정" 버튼. narrative가 원본 초안과 다르면 isEdited=true로 저장해
  // 사람이 손댔는지 감사 시 구분할 수 있게 한다.
  const handleConfirmDraft = async () => {
    if (!generateTarget || !departmentId || !draftData) return;

    setSaving(true);
    setGenerateError(null);
    try {
      const isEdited = draftNarrative !== draftData.narrative;
      const res = await confirmEvidenceDraft({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: generateTarget.no,
        draftContent: draftData.narrative,
        editedContent: draftNarrative,
        stats: draftData.stats,
        isEdited,
      });
      const { fileName, filePath, secondaryFileName, secondaryFilePath, result } = res.data;

      setItems((prev) =>
        prev.map((i) =>
          i.no === generateTarget.no
            ? {
                ...i,
                evidence: "준비완료",
                file: fileName,
                filePath,
                secondaryFile: secondaryFileName,
                secondaryFilePath,
                result,
              }
            : i
        )
      );
      setModalStep("pick-result");
    } catch (err) {
      console.error("초안 확정 실패", err);
      setGenerateError(err.response?.data?.error?.message || "초안 확정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 업로드(수동) 항목의 "업로드"/"재업로드" 버튼 클릭. 실제 선택은 숨겨진 input이 담당한다.
  const triggerUpload = (item) => {
    setUploadTarget(item);
    fileInputRef.current?.click();
  };

  // 파일 선택창에서 파일을 고른 직후 실행된다.
  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화
    if (!file || !uploadTarget || !departmentId) return;

    setUploading(true);
    try {
      const res = await uploadEvidenceItem({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: uploadTarget.no,
        file,
      });
      const { fileName, filePath, result } = res.data;

      setItems((prev) =>
        prev.map((i) =>
          i.no === uploadTarget.no
            ? { ...i, evidence: "준비완료", file: fileName, filePath, result }
            : i
        )
      );
      // 생성 플로우와 동일하게, 업로드 직후 결과값을 바로 확정하게 한다.
      setModalStep("pick-result");
      setGenerateTarget(uploadTarget);
    } catch (err) {
      console.error("증빙파일 업로드 실패", err);
      alert(err.response?.data?.error?.message || "증빙파일 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      setUploadTarget(null);
    }
  };

  // 업로드/생성된 증빙파일 삭제. S3 원본까지 같이 지워지므로 되돌릴 수 없다.
  const handleDeleteEvidence = async (item) => {
    if (!departmentId) return;
    if (!window.confirm(`"${item.file}" 파일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    setDeletingItemNo(item.no);
    try {
      const res = await deleteEvidenceItem({
        departmentId,
        targetYear: TARGET_YEAR,
        itemNo: item.no,
      });
      const { result } = res.data;

      setItems((prev) =>
        prev.map((i) =>
          i.no === item.no
            ? {
                ...i,
                evidence: "미준비",
                file: null,
                filePath: null,
                secondaryFile: null,
                secondaryFilePath: null,
                result,
              }
            : i
        )
      );
    } catch (err) {
      console.error("증빙파일 삭제 실패", err);
      alert(err.response?.data?.error?.message || "증빙파일 삭제에 실패했습니다.");
    } finally {
      setDeletingItemNo(null);
    }
  };

  // "평가결과 요약" 탭: 이미 로드된 items를 그대로 집계한다 (신규 API 호출 없음).
  const categoryStats = useMemo(
    () =>
      categoryMeta.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key);
        const prepared = catItems.filter((i) => i.evidence === "준비완료").length;
        return {
          key: cat.key,
          label: cat.label,
          total: catItems.length,
          prepared,
          percentage: catItems.length ? Math.round((prepared / catItems.length) * 100) : 0,
        };
      }),
    [items, categoryMeta]
  );

  const resultBuckets = useMemo(() => {
    const buckets = { 이행: 0, 부분이행: 0, 미이행: 0, 미제출: 0 };
    items.forEach((item) => {
      if (item.evidence !== "준비완료") {
        buckets.미제출 += 1;
      } else {
        buckets[item.result] = (buckets[item.result] ?? 0) + 1;
      }
    });
    return buckets;
  }, [items]);

  const resultDistribution = useMemo(
    () => [
      { name: "이행", value: resultBuckets.이행, color: "#07815f" },
      { name: "부분이행", value: resultBuckets.부분이행, color: "#a85f08" },
      { name: "미이행", value: resultBuckets.미이행, color: "#e42438" },
      { name: "미제출", value: resultBuckets.미제출, color: "#64738b" },
    ],
    [resultBuckets]
  );

  const unpreparedItems = useMemo(
    () => items.filter((i) => i.evidence !== "준비완료"),
    [items]
  );

  // "평가결과 요약" 탭에서 미제출 항목을 클릭하면 상세 탭의 해당 행으로 이동해 강조한다.
  const goToItemDetail = (item) => {
    setFilterCategory("전체");
    setFilterResult("전체");
    setFilterEvidence("전체");
    setExpanded((prev) => ({ ...prev, [item.category]: true }));
    setActiveTab("detail");
    setHighlightItemNo(item.no);
  };

  useEffect(() => {
    if (activeTab !== "detail" || !highlightItemNo) return;
    const row = document.querySelector(`[data-item-no="${CSS.escape(highlightItemNo)}"]`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightItemNo(null), 2000);
    return () => clearTimeout(timer);
  }, [activeTab, highlightItemNo]);

  // blob 응답을 즉시 다운로드시키는 공용 트리거. 이 페이지에만 필요한 패턴이라 별도 유틸로 분리하지 않는다.
  const triggerBlobDownload = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportChecklistXlsx = async () => {
    if (!departmentId) return;
    setExporting("xlsx");
    try {
      const blob = await exportEvidenceChecklistXlsx({ departmentId, targetYear: TARGET_YEAR });
      triggerBlobDownload(blob, `증빙자료_체크리스트_${TARGET_YEAR}.xlsx`);
    } catch (err) {
      console.error("체크리스트 xlsx 다운로드 실패", err);
      alert("체크리스트 다운로드에 실패했습니다.");
    } finally {
      setExporting(null);
    }
  };

  const handleExportZip = async () => {
    if (!departmentId) return;
    setExporting("zip");
    try {
      const blob = await exportEvidenceZip({ departmentId, targetYear: TARGET_YEAR });
      triggerBlobDownload(blob, `증빙자료_${TARGET_YEAR}.zip`);
    } catch (err) {
      console.error("증빙파일 zip 다운로드 실패", err);
      alert("증빙파일 압축 다운로드에 실패했습니다.");
    } finally {
      setExporting(null);
    }
  };

  // 사이드바가 열려 있는 동안 생성/업로드로 결과·증빙상태가 바뀔 수 있으므로, 클릭 시점 스냅샷이 아니라
  // items에서 최신 값을 다시 찾아 보여준다.
  const detailItem = detailTarget ? items.find((i) => i.no === detailTarget.no) ?? detailTarget : null;

  return (
    <div className="evidence-checklist-page">
      <div className="ce-heading">
        <div>
          <h2>상시평가 증빙자료</h2>
          <p>정보보호 상시평가 대비 소명자료 준비 현황을 관리합니다.</p>
        </div>
      </div>

      <div className="ce-disclaimer-card">
        <div className="ce-disclaimer-content">
          <p className="ce-disclaimer-summary">
            본 자료는 「금융분야 인공지능 보안 안내서」 점검항목을 준용한 초안이며, 정보보호 상시평가
            143개 소항목과의 공식 매핑이 아닙니다.
          </p>

          <button
            type="button"
            className="ce-disclaimer-toggle"
            onClick={() => setDisclaimerOpen((v) => !v)}
          >
            {disclaimerOpen ? "자세히 접기" : "자세히 보기"}
            {disclaimerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {disclaimerOpen && (
            <div className="ce-disclaimer-detail">
              <p>
                정보보호 상시평가는 금융보안원이 금융회사를 대상으로 매년 실시하는 <strong>143개 소항목</strong>
                기준 자체평가입니다. 이 화면은 그중 생성형 AI 이용과 직접 관련된 항목만, 금융보안원이
                발간한 「금융분야 인공지능 보안 안내서」의 점검항목(대응 항목 총 <strong>38개</strong>)을
                준용해 재구성한 초안입니다.
              </p>
              <p>
                따라서 143개 소항목에 대한 공식 매핑표가 아니며, 143개 항목 중 물리적 보안·일반 정보시스템
                접근통제 등 AI와 직접 관련이 없는 항목은 포함하지 않았습니다. 실제 상시평가 제출 시에는
                반드시 금융보안원이 배포한 공식 143개 소항목 체크리스트를 기준으로 별도 대조·작성해야 합니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {loading && <div className="ce-loading">증빙자료 목록을 불러오는 중입니다...</div>}
      {error && <div className="ce-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="ce-panel ce-summary-panel">
            <div className="ce-summary-row">
              <span>평가구분: {TARGET_YEAR}년 자체평가 및 결과 제출</span>
              <span>진행상태: <strong>작성중</strong></span>
              <span>대상기간: {TARGET_YEAR}-01-01 ~ {TARGET_YEAR}-03-31</span>
            </div>
            <div className="ce-summary-progress">
              <span className="ce-summary-progress-label">
                소명자료 완성도 {totalPrepared}/{totalItems}항목 ({overallPct}%)
              </span>
              <div className="ce-progress-track">
                <div
                  className={`ce-progress-fill ${progressTone(overallPct)}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="ce-tab-list">
            <button
              className={`ce-tab ${activeTab === "detail" ? "active" : ""}`}
              onClick={() => setActiveTab("detail")}
            >
              평가결과 상세
            </button>
            <button
              className={`ce-tab ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              평가결과 요약
            </button>
            <button
              className={`ce-tab ${activeTab === "download" ? "active" : ""}`}
              onClick={() => setActiveTab("download")}
            >
              전체 자료 다운로드
            </button>
          </div>

          {activeTab === "summary" && (
            <div className="ce-summary-tab">
              <section className="ce-insight-card">
                <header className="ce-insight-header">
                  <span className="ce-insight-icon ce-insight-icon-primary"><FileCheck2 size={18} /></span>
                  <div>
                    <h3>핵심 지표</h3>
                    <p>{TARGET_YEAR}년 자체평가 준비 현황 요약</p>
                  </div>
                </header>
                <div className="ce-insight-metrics">
                  <div className="ce-insight-metric">
                    <span>전체 진행률</span>
                    <strong className="ce-tone-info">{overallPct}%</strong>
                    <small>{totalPrepared}/{totalItems}개 항목 준비완료</small>
                  </div>
                  <div className="ce-insight-metric">
                    <span>미제출</span>
                    <strong className="ce-tone-danger">{unpreparedItems.length}건</strong>
                    <small>아래 목록에서 바로 이동</small>
                  </div>
                  <div className="ce-insight-metric">
                    <span>준비완료</span>
                    <strong className="ce-tone-neutral">{totalPrepared}건</strong>
                    <small>전체 {totalItems}건 중</small>
                  </div>
                  <div className="ce-insight-metric">
                    <span>이행 완료</span>
                    <strong className="ce-tone-neutral">{resultBuckets.이행}건</strong>
                    <small>결과값 "이행" 기준</small>
                  </div>
                </div>
              </section>

              <div className="ce-summary-grid">
                <section className="ce-insight-card">
                  <header className="ce-insight-header">
                    <span className="ce-insight-icon ce-insight-icon-primary"><BarChart3 size={18} /></span>
                    <div>
                      <h3>대분류별 진행률</h3>
                      <p>카테고리별 준비완료 비율</p>
                    </div>
                  </header>
                  <div className="ce-summary-bar-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryStats} layout="vertical" margin={{ top: 4, left: 8, right: 32, bottom: 4 }} barSize={18}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 11, fill: "#526582" }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [`${value}%`, "진행률"]} cursor={{ fill: "#f6f8fc" }} />
                        <Bar dataKey="percentage" radius={[0, 6, 6, 0]} background={{ fill: "#e5eaf2", radius: 6 }}>
                          {categoryStats.map((c) => (
                            <Cell key={c.key} fill="#64738b" />
                          ))}
                          <LabelList
                            dataKey="percentage"
                            position="right"
                            formatter={(value) => `${value}%`}
                            style={{ fontSize: 11, fontWeight: 700, fill: "#3d4a63" }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="ce-insight-card">
                  <header className="ce-insight-header">
                    <span className="ce-insight-icon ce-insight-icon-cost"><PieChartIcon size={18} /></span>
                    <div>
                      <h3>결과 분포</h3>
                      <p>전체 {totalItems}개 항목 기준</p>
                    </div>
                  </header>
                  <div className="ce-summary-donut-row">
                    <div className="ce-summary-donut">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={resultDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={68}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {resultDistribution.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RePieChart>
                      </ResponsiveContainer>
                      <div className="ce-summary-donut-center">
                        <strong>{totalItems}</strong>
                        <span>전체 항목</span>
                      </div>
                    </div>
                    <div className="ce-summary-legend">
                      {resultDistribution.map((entry) => (
                        <div key={entry.name} className="ce-summary-legend-row">
                          <span className="ce-summary-legend-dot" style={{ background: entry.color }} />
                          <span className="ce-summary-legend-name">{entry.name}</span>
                          <strong>{entry.value}건</strong>
                          <span className="ce-summary-legend-pct">
                            {totalItems ? Math.round((entry.value / totalItems) * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <section className="ce-insight-card">
                <header className="ce-insight-header">
                  <span className="ce-insight-icon ce-insight-icon-warn"><ListChecks size={18} /></span>
                  <div>
                    <h3>미제출 항목</h3>
                    <p>{unpreparedItems.length}건 — 클릭하면 상세 탭의 해당 행으로 이동합니다</p>
                  </div>
                </header>
                {unpreparedItems.length === 0 ? (
                  <p className="ce-summary-empty">모든 항목이 준비완료 상태입니다.</p>
                ) : (
                  <ul className="ce-summary-unprepared-list">
                    {unpreparedItems.map((item) => (
                      <li key={item.no}>
                        <button type="button" onClick={() => goToItemDetail(item)}>
                          <span className="ce-col-no">{displayOrderByNo.get(item.no)}</span>
                          <span className="ce-summary-unprepared-category">{item.category}</span>
                          <span className="ce-summary-unprepared-title">{item.title}</span>
                          <span className={resultBadgeClass(item.result)}>{item.result}</span>
                          <ChevronRight size={14} className="ce-summary-unprepared-arrow" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {activeTab === "download" && (
            <div className="ce-download-tab">
              <section className="ce-insight-card">
                <header className="ce-insight-header">
                  <span className="ce-insight-icon ce-insight-icon-primary"><Download size={18} /></span>
                  <div>
                    <h3>전체 자료 다운로드</h3>
                    <p>현재 {totalPrepared}/{totalItems}개 항목({overallPct}%)의 증빙자료가 준비되어 있습니다</p>
                  </div>
                </header>

                <div className="ce-download-list">
                  <div className="ce-download-row">
                    <span className="ce-download-row-icon ce-download-row-icon-xlsx"><FileText size={18} /></span>
                    <div className="ce-download-row-body">
                      <strong>체크리스트 현황</strong>
                      <p>38개 항목 전체를 번호·항목명·대분류·결과·증빙파일명·제출일 기준 엑셀 1개 파일로 내려받습니다.</p>
                    </div>
                    <button type="button" className="ce-download-button" disabled={exporting === "xlsx"} onClick={handleExportChecklistXlsx}>
                      {exporting === "xlsx" ? "다운로드 중..." : "xlsx 다운로드"}
                    </button>
                  </div>

                  <div className="ce-download-row">
                    <span className="ce-download-row-icon ce-download-row-icon-zip"><FileArchive size={18} /></span>
                    <div className="ce-download-row-body">
                      <strong>증빙파일 전체</strong>
                      <p>현재까지 생성·업로드된 증빙파일 {totalPrepared}건을 zip 하나로 묶어 내려받습니다.</p>
                    </div>
                    <button type="button" className="ce-download-button" disabled={exporting === "zip"} onClick={handleExportZip}>
                      {exporting === "zip" ? "다운로드 중..." : "zip 다운로드"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "detail" && (
          <>
          <div className="ce-filters">
            <select className="ce-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="전체">대분류: 전체</option>
              {categoryMeta.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <select className="ce-select" value={filterResult} onChange={(e) => setFilterResult(e.target.value)}>
              <option value="전체">결과: 전체</option>
              <option value="이행">이행</option>
              <option value="부분이행">부분이행</option>
              <option value="미이행">미이행</option>
            </select>
            <select className="ce-select" value={filterEvidence} onChange={(e) => setFilterEvidence(e.target.value)}>
              <option value="전체">증빙상태: 전체</option>
              <option value="준비완료">준비완료</option>
              <option value="미준비">미준비</option>
            </select>
          </div>

          <div className="ce-category-list">
            <div className="ce-panel ce-category">
              <button className="ce-category-header" onClick={() => setNaExpanded((v) => !v)}>
                {naExpanded ? <ChevronDown size={16} className="ce-chevron" /> : <ChevronRight size={16} className="ce-chevron" />}
                <span className="ce-category-title ce-na-title">해당없음 (서비스 범위 외)</span>
                <span className="ce-na-tag">범위 외</span>
              </button>
              {naExpanded && (
                <div className="ce-na-body">
                  {naCategories.map((c) => (
                    <div key={c}>{c} — 매핑되는 점검항목 없음</div>
                  ))}
                </div>
              )}
            </div>

            {visibleCategories.map((cat) => {
              const catItems = items.filter((i) => i.category === cat.key);
              const prepared = catItems.filter((i) => i.evidence === "준비완료").length;
              const pct = catItems.length ? Math.round((prepared / catItems.length) * 100) : 0;
              const tone = progressTone(pct);
              const isOpen = expanded[cat.key];
              const rows = filteredItems(catItems);

              return (
                <div key={cat.key} className="ce-panel ce-category">
                  <button
                    className="ce-category-header"
                    onClick={() => setExpanded((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                  >
                    {isOpen ? <ChevronDown size={16} className="ce-chevron" /> : <ChevronRight size={16} className="ce-chevron" />}
                    <span className="ce-category-title">{cat.label}</span>
                    <span className={`ce-count-badge ${tone}`}>
                      {prepared}/{catItems.length} 준비완료
                    </span>
                    <div className="ce-progress-track ce-progress-track-sm">
                      <div className={`ce-progress-fill ${tone}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="ce-pct-text">{pct}%</span>
                  </button>

                  {isOpen && (
                    <div className="ce-table-wrapper">
                      <table className="ce-table">
                        <thead>
                          <tr>
                            <th className="ce-col-no">번호</th>
                            <th className="ce-col-original-no">원문번호</th>
                            <th className="ce-col-title">항목명</th>
                            <th className="ce-col-result">결과</th>
                            <th className="ce-col-evidence">증빙상태</th>
                            <th className="ce-col-file">증빙파일</th>
                            <th className="ce-col-manage">관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 && (
                            <tr>
                              <td colSpan={7} className="ce-empty-row">
                                필터 조건에 해당하는 항목이 없습니다.
                              </td>
                            </tr>
                          )}
                          {rows.map((item) => (
                            <tr
                              key={item.no}
                              data-item-no={item.no}
                              className={highlightItemNo === item.no ? "ce-row-highlight" : ""}
                            >
                              <td className="ce-col-no">{displayOrderByNo.get(item.no)}</td>
                              <td className="ce-col-original-no">{item.no}</td>
                              <td className="ce-col-title">
                                <button
                                  type="button"
                                  className="ce-title-button"
                                  onClick={() => setDetailTarget(item)}
                                  title="클릭해서 상세 설명 보기"
                                >
                                  {item.title}
                                </button>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="ce-result-badge-button"
                                  onClick={() => openEditResultModal(item)}
                                  title="클릭해서 결과 수정"
                                >
                                  <span className={resultBadgeClass(item.result)}>{item.result}</span>
                                </button>
                              </td>
                              <td>
                                {item.evidence === "준비완료" ? (
                                  <span className="ce-evidence-done"><Check size={12} /> 준비완료</span>
                                ) : (
                                  <span className="ce-evidence-pending"><Circle size={10} /> 미준비</span>
                                )}
                              </td>
                              <td className="ce-col-file">
                                <div className="ce-file-cell">
                                  {item.filePath ? (
                                    <a className="ce-file-link" href={item.filePath} target="_blank" rel="noreferrer" title={item.file}>
                                      <FileText size={12} />{item.file}
                                    </a>
                                  ) : item.file ? (
                                    <span className="ce-file-link" title={item.file}><FileText size={12} />{item.file}</span>
                                  ) : null}

                                  {item.secondaryFilePath && (
                                    <a className="ce-file-link" href={item.secondaryFilePath} target="_blank" rel="noreferrer" title={item.secondaryFile}>
                                      <FileText size={12} />{item.secondaryFile}
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="ce-col-manage">
                                <div className="ce-manage-cell">
                                  {(() => {
                                    const mode = getGenerationMode(item.no);
                                    if (mode === "auto") {
                                      return (
                                        <button type="button" className="ce-generate-button" onClick={() => openGenerateModal(item)}>
                                          <Sparkles size={12} /> {item.filePath ? "재생성" : "생성"}
                                        </button>
                                      );
                                    }
                                    if (mode === "draft") {
                                      return (
                                        <button type="button" className="ce-generate-button" onClick={() => openDraftModal(item)}>
                                          <Sparkles size={12} /> {item.filePath ? "초안 재생성" : "초안 생성"}
                                        </button>
                                      );
                                    }
                                    if (mode === "template") {
                                      return (
                                        <>
                                          <button type="button" className="ce-generate-button" onClick={() => openGenerateModal(item)}>
                                            <Sparkles size={12} /> {item.filePath ? "템플릿 재생성" : "템플릿 생성"}
                                          </button>
                                          <button
                                            type="button"
                                            className="ce-upload-button"
                                            disabled={uploading}
                                            onClick={() => triggerUpload(item)}
                                          >
                                            <Upload size={12} /> {item.file ? "재업로드" : "업로드"}
                                          </button>
                                        </>
                                      );
                                    }
                                    return (
                                      <button
                                        type="button"
                                        className="ce-upload-button"
                                        disabled={uploading}
                                        onClick={() => triggerUpload(item)}
                                      >
                                        <Upload size={12} /> {item.file ? "재업로드" : "업로드"}
                                      </button>
                                    );
                                  })()}
                                  {item.file && (
                                    <button
                                      type="button"
                                      className="ce-delete-button"
                                      disabled={deletingItemNo === item.no}
                                      onClick={() => handleDeleteEvidence(item)}
                                    >
                                      <Trash2 size={12} /> 삭제
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </>
          )}

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileSelected}
          />

          {generateTarget && (() => {
            const targetMode = getGenerationMode(generateTarget.no);
            const logFields = LOG_ENTRY_FIELDS[generateTarget.no];

            const modalTitle =
              modalStep === "confirm-generate"
                ? targetMode === "template" ? "템플릿 생성" : "증빙자료 생성"
                : modalStep === "draft-loading" || modalStep === "draft-edit"
                ? "초안 생성"
                : "결과 확인·수정";

            return (
              <div className="ce-modal-backdrop" role="presentation" onMouseDown={closeModal}>
                <div
                  className={`ce-modal ${modalStep === "draft-edit" ? "ce-modal-wide" : ""}`}
                  role="dialog"
                  aria-modal="true"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <header className="ce-modal-header">
                    <h3>
                      {modalTitle}
                      {" — "}{displayOrderByNo.get(generateTarget.no)}. {generateTarget.title}
                      <span className="ce-modal-original-no"> (원문번호 {generateTarget.no})</span>
                    </h3>
                    <button type="button" className="ce-modal-close" onClick={closeModal} disabled={saving}>
                      닫기
                    </button>
                  </header>

                  <div className="ce-modal-body">
                    <p className="ce-modal-desc">{generateTarget.preparedMaterial}</p>

                    {modalStep === "confirm-generate" && (
                      <>
                        <p className="ce-modal-hint">
                          {targetMode === "template"
                            ? "안내서 근거와 빈 작성란이 담긴 docx 양식을 생성합니다. 통계는 자동 집계되지 않으니, 내용을 채운 뒤 재업로드로 최종 완료하십시오."
                            : generateTarget.filePath
                            ? "기존 증빙파일을 최신 데이터로 다시 생성하시겠습니까? 기존 파일은 대체됩니다."
                            : "실제 탐지·처리 로그를 기반으로 증빙자료를 생성합니다. 생성 후 결과값(이행/부분이행/미이행)을 선택하는 단계로 이어집니다."}
                        </p>
                        {generateError && <p className="ce-modal-error">{generateError}</p>}
                        <div className="ce-modal-options">
                          <button
                            type="button"
                            className="ce-modal-option ce-modal-option-done"
                            disabled={saving}
                            onClick={targetMode === "template" ? handleTemplateGenerate : handleAutoGenerate}
                          >
                            {saving
                              ? "생성 중..."
                              : generateTarget.filePath
                              ? targetMode === "template" ? "템플릿 다시 생성하기" : "다시 생성하기"
                              : targetMode === "template" ? "템플릿 생성하기" : "지금 생성하기"}
                          </button>
                        </div>
                      </>
                    )}

                    {modalStep === "draft-loading" && (
                      <>
                        {generateError ? (
                          <p className="ce-modal-error">{generateError}</p>
                        ) : (
                          <p className="ce-modal-hint">초안을 생성하는 중입니다...</p>
                        )}
                      </>
                    )}

                    {modalStep === "draft-edit" && draftData && (
                      <div className="ce-draft-editor">
                        <div className="ce-draft-stats">
                          {Object.entries(draftData.stats)
                            .filter(([key]) => key !== "entries" && key !== "monthly")
                            .map(([key, value]) => (
                              <div key={key} className="ce-draft-stats-row">
                                <span>{key}</span>
                                <strong>{String(value)}</strong>
                              </div>
                            ))}
                          {Array.isArray(draftData.stats.monthly) && (
                            <div className="ce-draft-stats-monthly">
                              {draftData.stats.monthly.map((m) => (
                                <span key={m.month}>{m.month} {m.count}건</span>
                              ))}
                            </div>
                          )}
                          {Array.isArray(draftData.stats.entries) && draftData.stats.entries.length > 0 && (
                            <ul className="ce-draft-stats-entries">
                              {draftData.stats.entries.map((entry, idx) => (
                                <li key={idx}>
                                  {Object.entries(entry)
                                    .filter(([k]) => k !== "recordedBy" && k !== "recordedAt")
                                    .map(([, v]) => v)
                                    .join(" · ")}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {logFields && (
                          <div className="ce-log-entry-form">
                            <button
                              type="button"
                              className="ce-log-entry-toggle"
                              onClick={() => setLogEntryFormOpen((v) => !v)}
                            >
                              {logEntryFormOpen ? "기록 추가 취소" : "+ 기록 추가"}
                            </button>
                            {logEntryFormOpen && (
                              <div className="ce-log-entry-fields">
                                {logFields.map((field) => (
                                  <label key={field.key} className="ce-log-entry-field">
                                    <span>{field.label}</span>
                                    <input
                                      type={field.type}
                                      value={logEntryValues[field.key] ?? ""}
                                      onChange={(e) =>
                                        setLogEntryValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                                      }
                                    />
                                  </label>
                                ))}
                                <button
                                  type="button"
                                  className="ce-log-entry-save"
                                  disabled={logEntrySaving}
                                  onClick={handleSaveLogEntry}
                                >
                                  {logEntrySaving ? "저장 중..." : "기록 저장"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <textarea
                          className="ce-draft-textarea"
                          value={draftNarrative}
                          onChange={(e) => setDraftNarrative(e.target.value)}
                          rows={8}
                        />

                        {generateError && <p className="ce-modal-error">{generateError}</p>}
                        <div className="ce-modal-options">
                          <button
                            type="button"
                            className="ce-modal-option ce-modal-option-done"
                            disabled={saving}
                            onClick={handleConfirmDraft}
                          >
                            {saving ? "확정 중..." : "확정"}
                          </button>
                        </div>
                      </div>
                    )}

                    {modalStep === "pick-result" && (
                      <>
                        <p className="ce-modal-hint">
                          결과값을 선택하세요. 선택하지 않고 닫으면 기본값인 "미이행"으로 유지됩니다.
                        </p>
                        <div className="ce-modal-options">
                          <button
                            type="button"
                            className="ce-modal-option ce-modal-option-done"
                            disabled={saving}
                            onClick={() => handleResultOnlyUpdate("이행")}
                          >
                            이행으로 표시
                          </button>
                          <button
                            type="button"
                            className="ce-modal-option ce-modal-option-partial"
                            disabled={saving}
                            onClick={() => handleResultOnlyUpdate("부분이행")}
                          >
                            부분이행으로 표시
                          </button>
                          <button
                            type="button"
                            className="ce-modal-option ce-modal-option-none"
                            disabled={saving}
                            onClick={() => handleResultOnlyUpdate("미이행")}
                          >
                            미이행으로 유지
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {detailItem && (
            <div className="ce-detail-backdrop" role="presentation" onMouseDown={() => setDetailTarget(null)}>
              <aside className="ce-detail-sidebar" onMouseDown={(e) => e.stopPropagation()}>
                <header className="ce-detail-header">
                  <div>
                    <span className="ce-detail-no">
                      {displayOrderByNo.get(detailItem.no)}번 · 원문번호 {detailItem.no}
                    </span>
                    <h3>{detailItem.title}</h3>
                  </div>
                  <button type="button" className="ce-detail-close" onClick={() => setDetailTarget(null)}>
                    닫기
                  </button>
                </header>

                <div className="ce-detail-body">
                  <section className="ce-detail-section">
                    <h4>이 항목은 무엇을 점검하나요?</h4>
                    <p>
                      {detailItem.guideDetail ??
                        "금융보안원 「금융분야 인공지능 보안 안내서」의 해당 점검항목에 대한 설명이 아직 등록되지 않았습니다."}
                    </p>
                  </section>

                  <section className="ce-detail-section ce-detail-section-collect">
                    <h4>우리 회사는 실제로 무엇을 수집해야 하나요?</h4>
                    <p>
                      {detailItem.whatToCollect ??
                        "현재 시스템 기준 수집 대상 안내가 아직 등록되지 않았습니다."}
                    </p>
                  </section>

                  {detailItem.preparedMaterial && (
                    <section className="ce-detail-section">
                      <h4>준비 자료 예시</h4>
                      <p>{detailItem.preparedMaterial}</p>
                    </section>
                  )}

                  <section className="ce-detail-section">
                    <h4>현재 상태</h4>
                    <dl className="ce-detail-meta">
                      <div>
                        <dt>대분류</dt>
                        <dd>{detailItem.category}</dd>
                      </div>
                      <div>
                        <dt>결과</dt>
                        <dd>
                          <span className={resultBadgeClass(detailItem.result)}>{detailItem.result}</span>
                        </dd>
                      </div>
                      <div>
                        <dt>증빙상태</dt>
                        <dd>{detailItem.evidence}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default EvidenceChecklistPage;
