import { useMemo, useState } from "react";
import { Bot, CheckCircle, Plus, XCircle, } from "lucide-react";
import "./AdminModelPage.css";

const APPROVAL_STATUS_LABEL_MAP = {
  PENDING: "승인대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
};

const PLATFORM_LABEL_MAP = {
  OpenAI: "OpenAI",
  Azure: "Azure OpenAI",
  Anthropic: "Anthropic",
  Google: "Google AI",
  Internal: "사내 모델",
};

/* MOCK 데이터 추후 삭제 */
const INITIAL_MODELS = [
  {
    id: 1,
    modelName: "GPT-4o",
    platform: "OpenAI",
    requester: "장현지",
    approvalStatus: "APPROVED",
    isActive: true,
    requestedAt: "2026-07-22 10:30",
    description: "일반 업무 문서 요약 및 질의응답용 모델",
  },
  {
    id: 2,
    modelName: "Claude 3.5 Sonnet",
    platform: "Anthropic",
    requester: "이영아",
    approvalStatus: "PENDING",
    isActive: false,
    requestedAt: "2026-07-23 14:15",
    description: "리스크 검토 문서 분석용 모델",
  },
  {
    id: 3,
    modelName: "Gemini 1.5 Pro",
    platform: "Google",
    requester: "이지윤",
    approvalStatus: "PENDING",
    isActive: false,
    requestedAt: "2026-07-24 09:20",
    description: "마케팅 자료 초안 생성용 모델",
  },
  {
    id: 4,
    modelName: "Internal-KoLLM",
    platform: "Internal",
    requester: "관리자",
    approvalStatus: "APPROVED",
    isActive: true,
    requestedAt: "2026-07-20 16:00",
    description: "사내 문서 기반 한국어 특화 모델",
  },
];

function AdminModelPage() {
  // 전체 AI 모델 목록 상태
  // setModels를 통해 승인, 반려, 활성화, 모델 추가 결과를 반영
  const [models, setModels] = useState(INITIAL_MODELS);
  
  // 승인 상태 필터와 플랫폼 필터의 현재 선택값
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");

  // 모델 추가 모달의 열림 여부를 관리
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 모델 추가 폼의 입력값을 하나의 객체로 관리
  const [newModelForm, setNewModelForm] = useState({
    modelName: "",
    platform: "OpenAI",
    description: "",
  });

  // 현재 선택된 승인 상태와 플랫폼 조건에 맞는 모델만 추려냄
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesStatus = statusFilter === "ALL" || model.approvalStatus === statusFilter;
      const matchesPlatform = platformFilter === "ALL" || model.platform === platformFilter;

      return matchesStatus && matchesPlatform;
    });
  }, [models, statusFilter, platformFilter]);

  // 전체 모델 중 승인 대기 상태인 모델의 개수
  const pendingCount = models.filter((model) => model.approvalStatus === "PENDING").length;

  // 전체 모델 중 현재 활성화된 모델의 개수
  const activeCount = models.filter((model) => model.isActive).length;

  // 특정 모델의 활성/비활성 상태를 반대로 변경
  const handleToggleActive = (modelId) => {
    setModels((prev) =>
      prev.map((model) =>
        //클릭한 모델만 새로운 객체로 만들어 isActive 값을 변경
        model.id === modelId 
        ? {
            ...model,
            isActive: !model.isActive,
          }
        : model
      )
    );
  };

  // 특정 모델을 승인 상태로 변경하고 바로 활성화
  const handleApprove = (modelId) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === modelId
          ? {
              ...model,
              approvalStatus: "APPROVED",
              isActive: true,
            }
          : model
      )
    );
  };

  // 특정 모델을 반려 상태로 변경하고 비활성화
  const handleReject = (modelId) => {
    setModels((prev) =>
      prev.map((model) =>
        model.id === modelId
          ? {
              ...model,
              approvalStatus: "REJECTED",
              isActive: false,
            }
          :model
      )
    );
  };

  // 모델 추가 폼의 input, select, textarea 값을 공통으로 처리
  const handleNewModelChange = (e) => {
    const { name, value } = e.target;

    setNewModelForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 모델 추가 폼 제출 시 실행됨
  const handleAddModel = (e) => {
    // form 제출 시 페이지가 새로고침되는 기본 동작을 막음
    e.preventDefault();

    if (!newModelForm.modelName.trim()) {
      alert("모델명을 입력해주세요.");
      return;
    }

    const newModel = {
      // 현재 시간을 임시 고유 ID로 사용
      // 실제 백엔드 연동 시에는 서버가 생성한 ID를 사용할 예정
      id: Date.now(),
      modelName: newModelForm.modelName,
      platform: newModelForm.platform,
      requester: "관리자",

      // 관리자가 직접 등록한 모델은 승인 및 활성 상태로 바로 추가
      approvalStatus: "APPROVED",
      isActive: true,

      requestedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      description: newModelForm.description || "관리자가 직접 추가한 모델",
    };

    // 새 모델을 배열 맨 앞에 추가해 최신 항목이 먼저 보이도록 함
    setModels((prev) => [newModel, ...prev]);

    setNewModelForm({
      modelName: "",
      platform: "OpenAI",
      description: "",
    });

    setIsAddModalOpen(false);
  };

  return (
    <section className="admin-model-page">
      {/* 페이지 상단 제목과 모델 추가 버튼 영역 */}
      <div className="admin-model-header">
        <div>
          <p className="admin-model-eyebrow">Admin Console</p>
          <h2>AI 모델 관리</h2>
          <p>
            조직에서 사용할 수 있는 AI 모델을 등록하고,
            임직원의 모델 사용 신청을 승인 또는 반려합니다.
          </p>
        </div>

        {/* 클릭하면 모델 추가 모달을 연다. */}
        <button
          type="button"
          className="admin-model-add-button"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          모델 추가
        </button>
      </div>

      {/* 전체, 승인 대기, 활성 모델 개수를 보여주는 요약 카드 영역 */}
      <div className="admin-model-summary-grid">
        <div className="admin-model-summary-card">
          <span>전체 모델</span>
          <strong>{models.length}</strong>
        </div>

        <div className="admin-model-summary-card">
          <span>승인대기</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="admin-model-summary-card">
          <span>활성 모델</span>
          <strong>{activeCount}</strong>
        </div>
      </div>

      {/* 승인 상태와 플랫폼을 기준으로 목록을 필터링하는 영역 */}
      <div className="admin-model-filter-card">
        <div className="admin-model-filter-group">
          <label htmlFor="statusFilter">승인상태</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">승인대기</option>
            <option value="APPROVED">승인완료</option>
            <option value="REJECTED">반려</option>
          </select>
        </div>

        <div className="admin-model-filter-group">
          <label htmlFor="platformFilter">플랫폼</label>
          <select 
            id="platformFilter"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="ALL">전체 플랫폼</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Azure">Azure OpenAI</option>
            <option value="Anthropic">Anthropic</option>
            <option value="Google">Google AI</option>
            <option value="Internal">사내 모델</option>
          </select>
        </div>

        {/* 현재 필터 조건에 해당하는 모델 개수를 표시 */}
        <div className="admin-model-filter-result">
          총 <strong>{filteredModels.length}</strong>건
        </div>
      </div>

      {/* AI 모델 신청 및 등록 현황 테이블 영역 */}
      <div className="admin-model-table-card">
        <div className="admin-model-table-header">
          <h3>AI 모델 신청 및 등록 현황</h3>
          <span>승인된 모델만 활성화할 수 있습니다.</span>
        </div>

        <div className="admin-model-table-wrapper">
          <table className="admin-model-table">
            <thead>
              <tr>
                <th>모델명</th>
                <th>플랫폼</th>
                <th>신청자</th>
                <th>승인상태</th>
                <th>활성여부</th>
                <th>신청일시</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {/* 필터링된 모델 목록을 한 줄씩 렌더링 */}
              {filteredModels.map((model) => (
                <tr key={model.id}>
                  {/* 모델 아이콘, 모델명, 설명 */}
                  <td>
                    <div className="admin-model-name-cell">
                      <div className="admin-model-icon">
                        <Bot size={17} />
                      </div>

                      <div>
                        <strong>{model.modelName}</strong>
                        <span>{model.description}</span>
                      </div>
                    </div>
                  </td>

                  {/* 플랫폼 코드값을 화면용 이름으로 변환해 표시 */}
                  <td>{PLATFORM_LABEL_MAP[model.platform]}</td>

                  <td>{model.requester}</td>

                  {/* 승인 상태에 따라 배지 문구와 CSS 클래스가 달라짐 */}
                  <td>
                    <span className={`admin-model-status-badge ${model.approvalStatus}`}>
                      {APPROVAL_STATUS_LABEL_MAP[model.approvalStatus]}
                    </span>
                  </td>

                  {/* 승인된 모델만 활성/비활성 토글을 조작할 수 있다. */}
                  <td>
                    <button
                      type="button"
                      className={
                        model.isActive ? "admin-model-toggle active" : "admin-model-toggle"
                      }
                      onClick={() => handleToggleActive(model.id)}
                      disabled={model.approvalStatus !== "APPROVED"}
                    >
                      {/* 실제 스위치 원형 손잡이 역할 하는 요소 */}
                      <span />
                    </button>
                  </td>

                  <td>{model.requestedAt}</td>

                  {/* 승인 및 반려 처리 버튼 */}
                  <td>
                    <div className="admin-model-action-buttons">
                      {/* 이미 승인된 모델은 승인 버튼을 다시 누를 수 없다. */}
                      <button 
                        type="button"
                        className="admin-model-approve-button"
                        onClick={() => handleApprove(model.id)}
                        disabled={model.approvalStatus === "APPROVED"}
                      >
                        <CheckCircle size={14} />
                        승인
                      </button>

                      {/* 이미 반려된 모델은 반려 버튼을 다시 누를 수 없다. */}
                      <button
                        type="button"
                        className="admin-model-reject-button"
                        onClick={() => handleReject(model.id)}
                        disabled={model.approvalStatus === "REJECTED"}
                      >
                        <XCircle size={14} />
                        반려
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* 필터 결과가 없을 때 보여주는 빈 목록 안내 문구 */}
              {filteredModels.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-model-empty-message">
                    조건에 맞는 모델 신청 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* isAddModalOpen이 true일 때만 모델 추가 모달을 렌더링 */}
      {/* 모달 뒤쪽 화면을 덮는 반투명 배경 */}
      {isAddModalOpen && (
        <div className="admin-model-modal-backdrop">
          <div className="admin-model-modal">
            {/* 모달 제목과 닫기 버튼 영역 */}
            <div className="admin-model-modal-header">
              <div>
                <p>모델 추가</p>
                <h3>관리자 직접 모델 등록</h3>
              </div>

              <button 
                type="button"
                className="admin-model-modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>

            {/* 제출 시 handleAddModel 함수가 실행 */}
            <form onSubmit={handleAddModel}>
              <div className="admin-model-modal-body">
                {/* 모델명 입력 */}
                <div className="admin-model-form-group">
                  <label htmlFor="modelName">모델명</label>
                  <input
                    id="modelName"
                    name="modelName"
                    value={newModelForm.modelName}
                    onChange={handleNewModelChange}
                    placeholder="예: GPT-4o mini"
                  />
                </div>

                {/* 플랫폼 선택 */}
                <div className="admin-model-form-group">
                  <label htmlFor="platform">플랫폼</label>
                  <select
                    id="platform"
                    name="platform"
                    value={newModelForm.platform}
                    onChange={handleNewModelChange}
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Azure">Azure OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Google">Google AI</option>
                    <option value="Internal">사내 모델</option>
                  </select>
                </div>

                {/* 모델 사용 목적 또는 설명 입력 */}
                <div className="admin-model-form-group">
                  <label htmlFor="description">설명</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newModelForm.description}
                    onChange={handleNewModelChange}
                    placeholder="모델 사용 목적이나 설명을 입력해주세요."
                  />
                </div>
              </div>

              {/* 모달 하단 취소 및 추가 버튼 */}
              <div className="admin-model-modal-footer">
                <button
                  type="button"
                  className="admin-model-cancel-button"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  취소
                </button>

                <button 
                  type="submit"
                  className="admin-model-save-button"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminModelPage;
