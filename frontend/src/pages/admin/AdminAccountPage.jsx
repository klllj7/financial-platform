import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { 
  getAdminUsers, 
  getAdminRoles, 
  getAdminDepartments,
  getAdminUserLoginHistories,
  updateAdminUserRole, 
  updateAdminUserStatus,
} from "../../api/adminApi";
import "./AdminAccountPage.css";

const STATUS_LABEL_MAP = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
};

// 로그인 이력 상태 표시용 라벨
// DB에는 SUCCESS / FAIL로 저장하고, 화면에서는 한글로 표시
const LOGIN_HISTORY_STATUS_LABEL_MAP = {
  SUCCESS: "성공",
  FAIL: "실패",
};

// 로그인 실패 사유 표시용 라벨
// DB에는 코드값으로 저장하고, 화면에서는 관리자가 이해하기 쉬운 문구로 표시
const LOGIN_FAIL_REASON_LABEL_MAP = {
  INVALID_PASSWORD: "비밀번호 불일치",
  INACTIVE_ACCOUNT: "비활성 계정 로그인 시도",
};

// 날짜/시간 표시 형식 변환
const formatDateTime = (dateValue) => {
  // 로그인 이력이 없는 경우
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  // 잘못된 날짜 값이 들어온 경우 화면이 깨지지 않도록 처리
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  /*
    ko-KR 기본 결과는 "2026. 07. 29. 14:12"처럼 공백이 들어갈 수 있음
    화면에서는 조금 더 깔끔하게 보이도록 공백 정리 
  */
  return formatter.format(date).replace(/\.\s/g, ".").replace(".", ".");
};

function AdminAccountPage() {
  // 부서, 역할 필터
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [searchKeyword, setSearchKeyword] = useState(""); // 검색

  const [users, setUsers] = useState([]);                 // DB에서 불러온 사용자 목록
  const [roles, setRoles] = useState([]);                 // DB에서 조회한 권한 목록
  const [departments, setDepartments] = useState([]);     // DB에서 조회한 부서 목록

  const [isLoading, setIsLoading] = useState(false);      // 목록 로딩 상태
  const [errorMessage, setErrorMessage] = useState("");   // 목록 조회 에러 메시지

  const [selectedUser, setSelectedUser] = useState(null); // 권한 변경 버튼을 누른 사용자 정보
  const [selectedRole, setSelectedRole] = useState("");   // 모달에서 선택한 새 권한

  const [loginHistoryUser, setLoginHistoryUser] = useState(null);               // 로그인 이력 모달에서 보여줄 사용자 정보
  const [loginHistories, setLoginHistories] = useState([]);                     // 선택한 사용자의 로그인 이력 목록
  const [isLoginHistoryLoading, setIsLoginHistoryLoading] = useState(false);  // 로그인 이력 조회 로딩 상태

  // 관리자 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await getAdminUsers();

      console.log("관리자 사용자 목록 조회 성공:", result);

      setUsers(result.data);
    } catch (error) {
      console.error("관리자 사용자 목록 조회 실패:", error);

      setErrorMessage(
        error.response?.data?.error?.message ||
        "사용자 목록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountOptions = async () => {
    try {
      const [rolesResult, departmentsResult] = await Promise.all([
        getAdminRoles(),
        getAdminDepartments(),
      ]);

      setRoles(rolesResult.data);
      setDepartments(departmentsResult.data);
    } catch (error) {
      console.error("부서/권한 목록 조회 실패: ", error);

      alert(
        error.response?.data?.error?.message || "부서/권한 목록을 불러오지 못했습니다."
      );
    }
  };

  // 권한 변경 버튼 클릭 시 실행
  const handleRoleChangeClick = (user) => {
    setSelectedUser(user);

    // 모달이 열릴 때 현재 권한을 기본 선택값으로 설정
    setSelectedRole(user.role?.code || "");

    console.log("권한 변경 대상 사용자: ", user);
  };

  const handleSaveRoleChange = async () => {
    if (!selectedUser) {
      return;
    }

    if (!selectedRole) {
      alert("변경할 권한을 선택해주세요.");
      return;
    }

    try {
      const result = await updateAdminUserRole(selectedUser.id, selectedRole);

      console.log("권한 변경 성공: ", result);
      alert("권한이 변경되었습니다.");

      // 모달 닫기
      setSelectedUser(null);

      // DB에서 사용자 목록 다시 조회해서 화면 갱신
      await fetchUsers();
    } catch (error) {
      console.error("권한 변경 실패: ", error);

      alert(
        error.response?.data?.error?.message || "권한 변경에 실패했습니다."
      );
    }
  };

  // 사용자 활성/비활성 상태 변경
  const handleToggleUserStatus = async (user) => {
    // 현재 ACTIVE면 INACTIVE로, INACTIVE면 ACTIVE로 변경
    const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const confirmMessage =
      nextStatus === "INACTIVE"
        ? `${user.name} 계정을 비활성화하시겠습니까?`
        : `${user.name} 계정을 활성화하시겠습니까?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await updateAdminUserStatus(user.id, nextStatus);

      console.log("계정 상태 변경 성공:", result);

      alert(
        nextStatus === "INACTIVE"
          ? "계정이 비활성화되었습니다."
          : "계정이 활성화되었습니다."
      );

      // DB에서 사용자 목록을 다시 불러와 화면 갱신
      await fetchUsers();
    } catch (error) {
      console.error("계정 상태 변경 실패:", error);

      alert(
        error.response?.data?.error?.message ||
          "계정 상태 변경에 실패했습니다."
      );
    }
  };

  // 로그인 이력 버튼 클릭 시 진행
  const handleLoginHistoryClick = async (user) => {
    try {
      setIsLoginHistoryLoading(true);

      // 먼저 모달에 표시할 사용자 정보를 저장
      setLoginHistoryUser(user);

      // 해당 사용자의 로그인 이력 API 호출
      const result = await getAdminUserLoginHistories(user.id);

      console.log("로그인 이력 조회 성공: ", result);

      setLoginHistories(result.data.histories);
    } catch (error) {
      console.error("로그인 이력 조회 실패: ", error);

      alert(
        error.response?.data?.error?.message || "로그인 이력을 불러오지 못했습니다."
      );

      // 조회 실패 시 모달을 닫고 상태를 초기화
      setLoginHistoryUser(null);
      setLoginHistories([]);
    } finally {
      setIsLoginHistoryLoading(false);
    }
  };

  // 로그인 이력 모달 닫기
  const handleCloseLoginHistoryModal = () => {
    setLoginHistoryUser(null);
    setLoginHistories([]);
  };

  useEffect(() => {
    fetchUsers();
    fetchAccountOptions();
  }, []);

  // 선택된 부서/역할 조건 및 검색어에 맞게 사용자 목록 필터링
  const filteredUsers = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    return users.filter((user) => {
      const departmentCode = user.department?.code ?? "";
      const departmentName = user.department?.name ?? "";
      const roleCode = user.role?.code ?? "";
      const roleName = user.role?.name ?? "";

      const matchesDepartment = departmentFilter === "ALL" || departmentCode === departmentFilter;
      const matchesRole = roleFilter === "ALL" || roleCode === roleFilter;

      const matchesSearch = normalizedKeyword === "" ||
      [
        user.name,
        user.email,
        roleCode,
        roleName,
        departmentCode,
        departmentName,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedKeyword));

      return matchesDepartment && matchesRole && matchesSearch;
    });
  }, [users, departmentFilter, roleFilter, searchKeyword, ]);

  return (
    <section className="admin-account-page">
      {/* 페이지 상단 설명 영역 */}
      <div className="admin-page-header">
        <div>
          <p className="admin-page-eyebrow">Admin Console</p>
          <h2>계정 관리</h2>
          <p>
            조직 내 사용자의 부서, 권한, 로그인 상태를 확인하고
            권한 변경을 관리합니다.
          </p>
        </div>

        <div className="admin-page-icon">
          <ShieldCheck size={28} />
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="admin-filter-card">
        {/* 사용자 검색 */}
        <div className="admin-filter-group admin-search-group">
          <label htmlFor="adminUserSearch">사용자 검색</label>

          <div className="admin-account-search">
            <input
              id="adminUserSearch"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="이름, 이메일, 부서, 권한 검색"
            />

            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword("")}
                aria-label="검색어 초기화"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        <div className="admin-filter-group">
          <label htmlFor="departmentFilter">부서별 필터</label>
          <select
            id="departmentFilter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="ALL">전체 부서</option>
            {departments.map((department) => (
              <option key={department.id} value={department.code}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-group">
          <label htmlFor="roleFilter">역할별 필터</label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">전체 역할</option>
            {roles.map((role) => (
              <option key={role.id} value={role.code}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filter-result">
          총 <strong>{filteredUsers.length}</strong>명
        </div>
      </div>

      {/* 계정 목록 테이블 */}
      <div className="admin-table-card">
        <div className="admin-table-header">
          <h3>사용자 목록</h3>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-account-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>부서</th>
                <th>권한</th>
                <th>최근 로그인</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => {
                const departmentName = user.department?.name || "-";
                const roleCode = user.role?.code || "-";
                const roleName = user.role?.name || roleCode || "-";
                const status = user.status || "-";
                const statusName = STATUS_LABEL_MAP[status] || status;

                // 아직 최근 로그인 컬럼이 없으면 createdAt을 임시로 표시
                const lastLoginText = formatDateTime(user.lastLoginAt);

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-user-avatar">
                          {user.name.charAt(0)}
                        </div>
                        <strong>{user.name}</strong>
                      </div>
                    </td>

                    <td>{departmentName}</td>

                    <td>
                      <span className={`admin-role-badge ${roleCode}`}>
                        {roleName}
                      </span>
                    </td>

                    <td>{lastLoginText}</td>

                    <td>
                      {/* 활성/비활성 상태를 변경하는 토글 스위치 */}
                      <div className="admin-status-toggle-cell">
                        <button
                          type="button"
                          className={
                            status === "ACTIVE"
                              ? "admin-account-switch active"
                              : "admin-account-switch inactive"
                          }
                          onClick={() => handleToggleUserStatus(user)}
                          title={status === "ACTIVE" ? "활성 계정" : "비활성 계정"}
                          aria-label={
                            status === "ACTIVE"
                              ? "계정 비활성화"
                              : "계정 활성화"
                          }
                        >
                          <span className="admin-account-switch-thumb" />
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="admin-action-buttons">
                        <button
                          type="button"
                          className="admin-manage-button"
                          onClick={() => handleRoleChangeClick(user)}
                        >
                          권한 변경
                        </button>

                        <button 
                          type="button"
                          className="admin-login-history-button"
                          onClick={() => handleLoginHistoryClick(user)}
                        >
                          로그인 이력
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="admin-empty-message">
                    조건에 맞는 사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 권한 변경 모달 */}
      {selectedUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-role-modal">
            <div className="admin-role-modal-header">
              <div>
                <p>권한 변경</p>
                <h3>{selectedUser.name} 사용자 권한 관리</h3>
              </div>

              <button
                type="button"
                className="admin-modal-close-button"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-role-modal-body">
              <div className="admin-modal-user-summary">
                <div className="admin-user-avatar">
                  {selectedUser.name.charAt(0)}
                </div>

                <div>
                  <strong>{selectedUser.name}</strong>
                  <span>{selectedUser.department?.name || "-"}</span>
                </div>
              </div>

              <div className="admin-modal-info-list">
                <div>
                  <span>현재 권한</span>
                  <strong>{selectedUser.role?.name || selectedUser.role?.code || "-"}</strong>
                </div>

                <div className="admin-role-select-area">
                  <label htmlFor="roleSelect">변경할 권한</label>

                  <select
                    id="roleSelect"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.code}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span>최근 로그인</span>
                  <strong>{formatDateTime(selectedUser.lastLoginAt)}</strong>
                </div>

                <div>
                  <span>상태</span>
                  <strong>{STATUS_LABEL_MAP[selectedUser.status]}</strong>
                </div>
              </div>
            </div>

            <div className="admin-role-modal-footer">
              <button
                type="button"
                className="admin-modal-cancel-button"
                onClick={() => setSelectedUser(null)}
              >
                취소
              </button>

              <button
                type="button"
                className="admin-modal-save-button"
                onClick={handleSaveRoleChange}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 이력 모달 */}
      {loginHistoryUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-login-history-modal">
            <div className="admin-role-modal-header">
              <div>
                <p>로그인 이력</p>
                <h3>{loginHistoryUser.name} 사용자 접속 기록</h3>
              </div>

              <button
                type="button"
                className="admin-modal-close-button"
                onClick={handleCloseLoginHistoryModal}
              >
                ×
              </button>
            </div>

            <div className="admin-login-history-summary">
              <div>
                <span>사용자</span>
                <strong>{loginHistoryUser.name}</strong>
              </div>

              <div>
                <span>이메일</span>
                <strong>{loginHistoryUser.email}</strong>
              </div>

              <div>
                <span>권한</span>
                <strong>{loginHistoryUser.role?.name || loginHistoryUser.role?.code || "-"}</strong>
              </div>
            </div>

            <div className="admin-login-history-body">
              {isLoginHistoryLoading ? (
                <p className="admin-login-history-empty">
                  로그인 이력을 불러오는 중입니다...
                </p>
              ) : loginHistories.length === 0 ? (
                <p className="admin-login-history-empty">
                  저장된 로그인 이력이 없습니다.
                </p>
              ) : (
                <div className="admin-login-history-table-wrapper">
                  <table className="admin-login-history-table">
                    <thead>
                      <tr>
                        <th>상태</th>
                        <th>실패 사유</th>
                        <th>IP</th>
                        <th>접속 환경</th>
                        <th>로그인 시각</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loginHistories.map((history) => {
                        const statusLabel = LOGIN_HISTORY_STATUS_LABEL_MAP[history.status] || history.status;
                        const failReasonLabel = LOGIN_FAIL_REASON_LABEL_MAP[history.failReason] || history.failReason || "-";

                        return (
                          <tr key={history.id}>
                            <td>
                              <span
                                className={
                                  history.status === "SUCCESS" ? "admin-login-status-badge success" : "admin-login-status-badge fail"
                                }
                              >
                                {statusLabel}
                              </span>
                            </td>

                            <td>{failReasonLabel}</td>
                            <td>{history.ipAddress || "-"}</td>

                            <td
                              className="admin-login-user-agent"
                              title={history.userAgent || "-"}
                            >
                              {history.userAgent || "-"}
                            </td>

                            <td>{formatDateTime(history.loggedInAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-role-modal-footer">
              <button
                type="button"
                className="admin-modal-cancel-button"
                onClick={handleCloseLoginHistoryModal}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminAccountPage;