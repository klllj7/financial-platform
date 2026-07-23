/* 사이드바에서 사용할 아이콘 */
import {
  Bell,
  Bot,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";

/*
  NavLink는 메뉴 이동과 활성 메뉴 표시를 담당한다.
  useNavigate는 로그아웃 후 로그인 페이지 이동에 사용한다.
*/
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

function Sidebar() {
  // 함수 안에서 페이지를 이동하기 위해 사용한다.
  const navigate = useNavigate();

  // localStorage에 저장된 로그인 사용자 정보 가져오기
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // 사용자 이름
  const userName = user?.name || "사용자";

  // 사용자 이름 첫 글자
  const userInitial = userName.charAt(0);

  // 부서명
  // department가 객체일 수도 있고 문자열일 수도 있어서 둘다 대응
  const departmentName = user?.department?.name || user?.department || "-";

  // 로그아웃 버튼 클릭 시 실행되는 함수
  const handleLogout = () => {
    // 로그인 토큰과 사용자 정보 삭제
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside className="sidebar">
      {/* 서비스 로고 영역 */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ShieldCheck size={22} />
        </div>

        <div className="sidebar-logo-text">
          <strong>ComplianceAI</strong>
          <span>AI 거버넌스 플랫폼</span>
        </div>
      </div>

      {/* 상단 주요 메뉴 */}
      <nav className="sidebar-menu">
        {/* 마이 대시보드 */}
        <NavLink
          to="/my-dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={18} />
          <span>마이 대시보드</span>
        </NavLink>

        {/* AI 사용하기 */}
        <NavLink
          to="/ai-chat"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <Bot size={18} />
          <span>AI 사용하기</span>
        </NavLink>
      </nav>

      {/* 사이드바 하단 고정 영역 */}
      <div className="sidebar-bottom">
        {/* 공지사항 전체 목록으로 이동한다. */}
        <NavLink
          to="/notices"
          className={({ isActive }) =>
            `sidebar-bottom-notice ${
              isActive ? "active" : ""
            }`
          }
        >
          <Bell size={18} />

          <span className="sidebar-bottom-notice-text">
            공지사항
          </span>

          <span className="notice-dot" />
        </NavLink>

        {/* 사용자 정보와 로그아웃 */}
        <div className="sidebar-account">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userInitial}</div>

            <div className="sidebar-user-text">
              <strong>{userName}</strong>
              <span>{departmentName}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;