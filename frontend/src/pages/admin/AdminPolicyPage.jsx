import { useMemo, useState } from "react";
import {
  CheckCircle,
  FileText,
  Search,
  XCircle,
} from "lucide-react";
import "./AdminPolicyPage.css";

const POLICY_STATUS_LABEL_MAP = {
  PENDING: "승인대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
};

const POLICY_TYPE_LABEL_MAP = {
  AI_USAGE: "AI 사용 정책",
  DLP: "민감정보 정책",
  MODEL: "모델 사용 정책",
  AUDIT: "감사/증적 정책",
};

const PRIORITY_LABEL_MAP = {
  HIGH: "높음",
  NORMAL: "보통",
  LOW: "낮음",
};

/* 서버 연동 전 화면 테스트에 사용하는 초기 정책 승인 요청 MOCK 데이터 */
const INITIAL_POLICIES = [
  {
    id: 1,
    policyName: "개인정보 포함 프롬프트 차단 정책",
    policyType: "DLP",
    requester: "이영아",
    department: "준법감시팀",
    version: "v1.2",
    requestedAt: "2026-07-24 09:30",
    status: "PENDING",
    priority: "HIGH",
    scope: "전사",
    summary: "주민등록번호, 계좌번호, 연락처 등 민감정보가 포함된 프롬프트 입력을 제한합니다.",
    content:
      "사용자가 생성형 AI에 프롬프트를 입력할 때 주민등록번호, 계좌번호, 휴대폰 번호, 이메일 등 개인정보 또는 금융 민감정보가 포함된 경우 자동으로 탐지하고 사용을 제한한다. 탐지된 항목은 감사 로그에 기록하며, 필요 시 비식별 처리 후 재요청할 수 있도록 안내한다.",
    changeReason:
      "최근 생성형 AI 사용량 증가로 인해 개인정보가 외부 모델로 전송될 가능성이 높아져 사전 차단 정책이 필요합니다.",
    changes: [
      "주민등록번호 패턴 탐지 규칙 추가",
      "계좌번호 탐지 기준 강화",
      "민감정보 탐지 시 감사 로그 저장",
    ],
  },
  {
    id: 2,
    policyName: "외부 LLM 사용 승인 절차 정책",
    policyType: "AI_USAGE",
    requester: "장현지",
    department: "IT보안팀",
    version: "v1.0",
    requestedAt: "2026-07-23 15:10",
    status: "APPROVED",
    priority: "NORMAL",
    scope: "전사",
    summary: "외부 LLM 사용 전 관리자 승인을 받도록 하는 정책입니다.",
    content:
      "임직원이 외부 생성형 AI 모델을 업무에 사용하려는 경우 사용 목적, 입력 데이터 유형, 예상 사용 기간을 작성하여 관리자에게 신청해야 한다. 관리자는 보안 위험도와 업무 필요성을 검토한 뒤 승인 또는 반려할 수 있다.",
    changeReason:
      "외부 AI 모델 사용 요청이 증가함에 따라 승인 절차를 표준화하기 위함입니다.",
    changes: [
      "외부 모델 신청 프로세스 정의",
      "승인 전 사용 제한 기준 추가",
      "신청 이력 보관 기준 추가",
    ],
  },
  {
    id: 3,
    policyName: "AI 출력 결과 검토 의무 정책",
    policyType: "AUDIT",
    requester: "이지윤",
    department: "여신심사팀",
    version: "v2.0",
    requestedAt: "2026-07-22 11:45",
    status: "PENDING",
    priority: "NORMAL",
    scope: "여신심사팀",
    summary: "AI가 생성한 결과를 업무에 반영하기 전 담당자가 검토하도록 합니다.",
    content:
      "AI가 생성한 분석 결과, 보고서 초안, 고객 응대 문구 등은 최종 업무 반영 전 담당자가 사실 여부와 규정 위반 가능성을 검토해야 한다. 검토 완료 여부는 사용 로그에 함께 기록한다.",
    changeReason:
      "AI 출력 결과를 그대로 사용하는 경우 잘못된 판단이나 규정 위반 가능성이 있어 검토 절차가 필요합니다.",
    changes: [
      "AI 출력 결과 검토 단계 추가",
      "검토자 기록 항목 추가",
      "검토 미완료 결과 사용 제한",
    ],
  },
  {
    id: 4,
    policyName: "미승인 모델 사용 제한 정책",
    policyType: "MODEL",
    requester: "김정욱",
    department: "마케팅팀",
    version: "v1.1",
    requestedAt: "2026-07-21 17:20",
    status: "REJECTED",
    priority: "LOW",
    scope: "마케팅팀",
    summary: "승인되지 않은 AI 모델 사용을 제한하는 정책입니다.",
    content:
      "관리자가 승인하지 않은 AI 모델은 업무용 포털에서 선택할 수 없으며, 승인 요청 이력이 없는 모델 사용은 시스템에서 차단한다.",
    changeReason:
      "마케팅팀 내 비공식 AI 모델 사용을 줄이고 승인된 모델 중심으로 사용을 통제하기 위함입니다.",
    changes: [
      "미승인 모델 목록 숨김",
      "모델 신청 이력 확인 조건 추가",
      "반려 모델 재신청 기준 추가",
    ],
  },
];

function AdminPolicyPage() {
  // 전체 정책 목록 상태
  const [policies, setPolicies] = useState(INITIAL_POLICIES);

  // 승인 상태 필터와 정책 유형 필터
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  
  // 정책명, 요청자, 부서를 검색하기 위한 검색어
  const [keyword, setKeyword] = useState("");

  // 상세 모달에 표시할 현재 선택 정책
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  /* 상태, 정책 유형, 검색어 조건에 맞는 정책만 추출 */
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesStatus = statusFilter === "ALL" || policy.status === statusFilter;
      const matchesType = typeFilter === "ALL" || policy.policyType === typeFilter;

      // 대소문자 구분 없이 검색하기 위해 검색어를 소문자로 변환
      const lowerKeyword = keyword.toLowerCase();

      const matchesKeyword = 
        policy.policyName.toLowerCase().includes(lowerKeyword) ||
        policy.requester.toLowerCase().includes(lowerKeyword) ||
        policy.department.toLowerCase().includes(lowerKeyword);

      return matchesStatus && matchesType && matchesKeyword;
    });
  }, [policies, statusFilter, typeFilter, keyword]);

  const pendingCount = policies.filter((policy) => policy.status === "PENDING").length;   // 승인대기 정책 수
  const approvedCount = policies.filter((policy) => policy.status === "APPROVED").length; // 승인완료 정책 수
  const rejectedCount = policies.filter((policy) => policy.status === "REJECTED").length; // 반려된 정책 수

  /* 선택한 정책의 상태를 승인완료로 변경 */
  const handleApprove = (policyId) => {
    // 전체 정책 목록에서 해당 ID의 정책만 찾아 상태 변경
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.id === policyId
          ? {
              ...policy,
              status: "APPROVED",
            }
          : policy
      )
    );

    // 상세 모달이 열려 있다면 모달 내부 상태도 함께 동기화
    setSelectedPolicy((prev) =>
      prev
        ? {
            ...prev,
            status: "APPROVED",
          }
        : prev
    );
  };

  /* 선택한 정책의 상태를 반려로 변경 */
  const handleReject = (policyId) => {
    setPolicies((prev) =>
      prev.map((policy) =>
        policy.id === policyId
          ? {
              ...policy,
              status: "REJECTED",
            }
          : policy
      )
    );

    setSelectedPolicy((prev) =>
      prev
        ? {
            ...prev,
            status: "REJECTED",
          }
        : prev
    );
  };

  return (
    <section className="admin-policy-page">
      {/* 페이지 상단 제목 및 설명 영역 */}
      <div className="admin-policy-header">
        <div>
          <p className="admin-policy-eyebrow">Admin Console</p>
          <h2>정책 승인</h2>
          <p>
            임직원 또는 보안 담당자가 요청한 AI 사용 정책을 검토하고,
            승인 또는 반려 처리합니다.
          </p>
        </div>

        <div className="admin-policy-header-icon">
          <FileText size={28} />
        </div>
      </div>

      {/* 승인대기, 승인완료, 반려 건수를 보여주는 요약 카드 */}
      <div className="admin-policy-summary-grid">
        <div className="admin-policy-summary-card">
          <span>승인대기</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="admin-policy-summary-card">
          <span>승인완료</span>
          <strong>{approvedCount}</strong>
        </div>

        <div className="admin-policy-summary-card">
          <span>반려</span>
          <strong>{rejectedCount}</strong>
        </div>
      </div>

      {/* 검색어 및 상태/유형 필터 영역 */}
      <div className="admin-policy-filter-card">
        {/* 정책명, 요청자, 부서를 대상으로 검색 */}
        <div className="admin-policy-search-box">
          <Search size={16} />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="정책명, 요청자, 부서 검색"
          />
        </div>

        <div className="admin-policy-filter-group">
          <label htmlFor="policyStatusFilter">상태</label>
          <select
            id="policyStatusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">승인대기</option>
            <option value="APPROVED">승인완료</option>
            <option value="REJECTED">반려</option>
          </select>
        </div>

        <div className="admin-policy-filter-group">
          <label htmlFor="policyTypeFilter">정책 유형</label>
          <select
            id="policyTypeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">전체 유형</option>
            <option value="AI_USAGE">AI 사용 정책</option>
            <option value="DLP">민감정보 정책</option>
            <option value="MODEL">모델 사용 정책</option>
            <option value="AUDIT">감사/증적 정책</option>
          </select>
        </div>

        <div className="admin-policy-filter-result">
          총 <strong>{filteredPolicies.length}</strong>건
        </div>
      </div>

      {/* 정책 승인 요청 목록 테이블 */}
      <div className="admin-policy-table-card">
        <div className="admin-policy-table-header">
          <h3>정책 승인 요청 목록</h3>
          <span>정책명을 클릭하면 상세 내용과 변경 사유를 확인할 수 있습니다.</span>
        </div>

        <div className="admin-policy-table-wrapper">
          <table className="admin-policy-table">
            <thead>
              <tr>
                <th>정책명</th>
                <th>유형</th>
                <th>요청자</th>
                <th>부서</th>
                <th>버전</th>
                <th>요청일</th>
                <th>상태</th>
                <th>우선순위</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {/* 필터 조건을 통과한 정책을 행으로 반복 출력 */}
              {filteredPolicies.map((policy) => (
                <tr key={policy.id}>
                  <td>
                    <button
                      type="button"
                      className="admin-policy-title-button"
                      /* 정책명을 클릭하면 선택한 정책을 상세 모달에 표시 */
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      <strong>{policy.policyName}</strong>
                      <span>{policy.summary}</span>
                    </button>
                  </td>

                  <td>{POLICY_TYPE_LABEL_MAP[policy.policyType]}</td>
                  <td>{policy.requester}</td>
                  <td>{policy.department}</td>
                  <td>{policy.version}</td>
                  <td>{policy.requestedAt}</td>

                  <td>
                    <span className={`admin-policy-status-badge ${policy.status}`}>
                      {POLICY_STATUS_LABEL_MAP[policy.status]}
                    </span>
                  </td>

                  <td>
                    <span className={`admin-policy-priority-badge ${policy.priority}`}>
                      {PRIORITY_LABEL_MAP[policy.priority]}
                    </span>
                  </td>

                  <td>
                    <div className="admin-policy-action-buttons">
                      <button
                        type="button"
                        className="admin-policy-approve-button"
                        onClick={() => handleApprove(policy.id)}
                        disabled={policy.status === "APPROVED"}
                      >
                        승인
                      </button>

                      <button
                        type="button"
                        className="admin-policy-reject-button"
                        onClick={() => handleReject(policy.id)}
                        disabled={policy.status === "REJECTED"}
                      >
                        반려
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* 필터 결과가 없을 때 안내 문구 표시 */}
              {filteredPolicies.length === 0 && (
                <tr>
                  <td colSpan="9" className="admin-policy-empty-message">
                    조건에 맞는 정책 승인 요청이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 선택한 정책이 있을 때만 상세 모달 표시 */}
      {selectedPolicy && (
        <div className="admin-policy-modal-backdrop">
          <div className="admin-policy-modal">
            <div className="admin-policy-modal-header">
              <div>
                <p>정책 상세</p>
                <h3>{selectedPolicy.policyName}</h3>
              </div>

              <button
                type="button"
                className="admin-policy-modal-close"
                onClick={() => setSelectedPolicy(null)}
              >
                ×
              </button>
            </div>

            {/* 정책의 기본 정보, 내용, 요청 사유, 변경사항 */}
            <div className="admin-policy-modal-body">
              <div className="admin-policy-detail-grid">
                <div>
                  <span>정책 유형</span>
                  <strong>{POLICY_TYPE_LABEL_MAP[selectedPolicy.policyType]}</strong>
                </div>

                <div>
                  <span>요청자</span>
                  <strong>{selectedPolicy.requester}</strong>
                </div>

                <div>
                  <span>부서</span>
                  <strong>{selectedPolicy.department}</strong>
                </div>

                <div>
                  <span>버전</span>
                  <strong>{selectedPolicy.version}</strong>
                </div>

                <div>
                  <span>요청일</span>
                  <strong>{selectedPolicy.requestedAt}</strong>
                </div>

                <div>
                  <span>상태</span>
                  <strong>{POLICY_STATUS_LABEL_MAP[selectedPolicy.status]}</strong>
                </div>

                <div>
                  <span>우선순위</span>
                  <strong>{PRIORITY_LABEL_MAP[selectedPolicy.priority]}</strong>
                </div>

                <div>
                  <span>적용 범위</span>
                  <strong>{selectedPolicy.scope}</strong>
                </div>
              </div>

              <div className="admin-policy-detail-section">
                <h4>정책 내용</h4>
                <p>{selectedPolicy.content}</p>
              </div>

              <div className="admin-policy-detail-section">
                <h4>요청 사유</h4>
                <p>{selectedPolicy.changeReason}</p>
              </div>

              <div className="admin-policy-detail-section">
                <h4>주요 변경사항</h4>
                <ul>
                  {/* 주요 변경사항 배열을 목록으로 출력 */}
                  {selectedPolicy.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 상세 모달 하단 닫기/반려/승인 버튼 */}
            <div className="admin-policy-modal-footer">
              <button
                type="button"
                className="admin-policy-modal-cancel-button"
                onClick={() => setSelectedPolicy(null)}
              >
                닫기
              </button>

              <button
                type="button"
                className="admin-policy-modal-reject-button"
                onClick={() => handleReject(selectedPolicy.id)}
                disabled={selectedPolicy.status === "REJECTED"}
              >
                <XCircle size={15} />
                반려
              </button>

              <button
                type="button"
                className="admin-policy-modal-approve-button"
                onClick={() => handleApprove(selectedPolicy.id)}
                disabled={selectedPolicy.status === "APPROVED"}
              >
                <CheckCircle size={15} />
                승인
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminPolicyPage;