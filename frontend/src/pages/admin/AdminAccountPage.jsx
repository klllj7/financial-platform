import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { getAdminUsers } from "../../api/adminApi";
import "./AdminAccountPage.css";

/*
  백엔드 연동 전 화면 확인용 Mock 데이터
  나중에 GET /api/admin/users 같은 API로 교체
*/
// const MOCK_USERS = [
//   {
//     id: 1,
//     name: "장현지",
//     department: "IT보안팀",
//     role: "ADMIN",
//     lastLoginAt: "2026-07-23 09:42",
//     status: "ACTIVE",
//   },
//   {
//     id: 2,
//     name: "이영아",
//     department: "준법감시팀",
//     role: "COMPLIANCE_MANAGER",
//     lastLoginAt: "2026-07-22 18:10",
//     status: "ACTIVE",
//   },
//   {
//     id: 3,
//     name: "이지윤",
//     department: "여신심사팀",
//     role: "EMPLOYEE",
//     lastLoginAt: "2026-07-21 14:25",
//     status: "ACTIVE",
//   },
//   {
//     id: 4,
//     name: "김정욱",
//     department: "마케팅팀",
//     role: "EMPLOYEE",
//     lastLoginAt: "2026-07-18 11:03",
//     status: "INACTIVE",
//   },
//   {
//     id: 5,
//     name: "이민주",
//     department: "고객지원팀",
//     role: "EMPLOYEE",
//     lastLoginAt: "2026-07-20 16:44",
//     status: "ACTIVE",
//   },
// ];

const ROLE_LABEL_MAP = {
  ADMIN: "관리자",
  COMPLIANCE_MANAGER: "보안/컴플라이언스",
  EMPLOYEE: "임직원",
};

const STATUS_LABEL_MAP = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
};

function AdminAccountPage() {
  // 부서, 역할 필터
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [users, setUsers] = useState([]);                 // DB에서 불러온 사용자 목록
  const [isLoading, setIsLoading] = useState(false);      // 목록 로딩 상태
  const [errorMessage, setErrorMessage] = useState("");   // 목록 조회 에러 메시지

  const [selectedUser, setSelectedUser] = useState(null); // 권한 변경 버튼을 누른 사용자 정보
  const [selectedRole, setSelectedRole] = useState("");   // 모달에서 선택한 새 권한


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

  // 권한 변경 버튼 클릭 시 실행
  const handleRoleChangeClick = (user) => {
    setSelectedUser(user);

    // 모달이 열릴 때 현재 권한을 기본 선택값으로 설정
    setSelectedRole(user.role?.code || "");

    console.log("권한 변경 대상 사용자: ", user);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 선택된 부서/역할 조건에 맞 사용자 목록 필터링
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const departmentName = user.department?.name || "-";
      const roleCode = user.role?.code || "-";

      const matchesDepartment = departmentFilter === "ALL" || departmentName === departmentFilter;
      const matchesRole = roleFilter === "ALL" || roleCode === roleFilter;

      return matchesDepartment && matchesRole;
    });
  }, [users, departmentFilter, roleFilter]);

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
        <div className="admin-filter-group">
          <label htmlFor="departmentFilter">부서별 필터</label>
          <select
            id="departmentFilter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="ALL">전체 부서</option>
            <option value="IT보안팀">IT보안팀</option>
            <option value="준법감시팀">준법감시팀</option>
            <option value="마케팅팀">마케팅팀</option>
            <option value="고객지원팀">고객지원팀</option>
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
            <option value="ADMIN">관리자</option>
            <option value="COMPLIANCE_MANAGER">보안/컴플라이언스</option>
            <option value="EMPLOYEE">임직원</option>
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
                const roleName = user.role?.name || ROLE_LABEL_MAP[roleCode] || "-";
                const status = user.status || "-";
                const statusName = STATUS_LABEL_MAP[status] || status;

                // 아직 최근 로그인 컬럼이 없으면 createdAt을 임시로 표시
                const lastLoginText = user.lastLoginAt || user.createdAt || "-";

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
                      <span className={`admin-status-badge ${status}`}>
                        {statusName}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-manage-button"
                        onClick={() => handleRoleChangeClick(user)}
                      >
                        권한 변경
                      </button>
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
                  <strong>{selectedUser.role?.name || ROLE_LABEL_MAP[selectedUser.role?.code] || "-"}</strong>
                </div>

                <div className="admin-role-select-area">
                  <label htmlFor="roleSelect">변경할 권한</label>

                  <select
                    id="roleSelect"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="EMPLOYEE">임직원</option>
                    <option value="COMPLIANCE_MANAGER">보안/컴플라이언스 담당자</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>

                <div>
                  <span>최근 로그인</span>
                  <strong>{selectedUser.lastLoginAt || selectedUser.createdAt || "-"}</strong>
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
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminAccountPage;