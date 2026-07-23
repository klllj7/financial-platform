/* 사이드바에서 사용할 아이콘 */
import {
  Bell,
  Bot,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UsersRound,
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
  
  // 사용자 역할
  const roleCode = user?.role || "EMPLOYEE";

  // 사용자 이름
  const userName = user?.name || "사용자";

  // 사용자 이름 첫 글자
  const userInitial = userName.charAt(0);

  // 부서명
  // department가 객체일 수도 있고 문자열일 수도 있어서 둘다 대응
  const departmentName = user?.department?.name || user?.department || "-";

  // 역할별 메뉴 배열 만들기
  const employeeMenus = [
    {
      to: "/my-dashboard",
      label: "마이 대시보드",
      icon: LayoutDashboard,
    },
    {
      to: "/ai-chat",
      label: "AI 사용하기",
      icon: Bot,
    },
  ];


  const complianceMenus = [
    {
      to: "/my-dashboard",
      label: "마이 대시보드",
      icon: LayoutDashboard,
    },
    {
      to: "/ai-chat",
      label: "AI 사용하기",
      icon: Bot,
    },
  ];

  const adminMenus = [
    {
      to: "/admin/accounts",
      label: "계정 관리",
      icon: UsersRound,
    },
  ];

  const menus = roleCode === "ADMIN" ? adminMenus : roleCode === "COMPLIANCE_MANAGER" ? complianceMenus : employeeMenus;

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
        {menus.map((menu) => {
          const Icon = menu.icon;

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

        {/* 상시평가 증빙자료 */}
        <NavLink
          to="/report/evidence"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <ClipboardCheck size={18} />
          <span>상시평가 증빙자료</span>
        </NavLink>
          return (
            <NavLink
              key={menu.to}
              to={menu.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{menu.label}</span>
            </NavLink>
          );
        })}
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