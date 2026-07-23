/*
  페이지 이동과 현재 선택된 메뉴 표시를 위해
  React Router 기능을 가져온다.

  NavLink:
  현재 주소와 메뉴 주소가 같을 때
  active 클래스를 자동으로 적용할 수 있다.

  useNavigate:
  로그아웃 후 로그인 페이지로 이동할 때 사용한다.
*/
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

/* 컴플라이언스 사이드바에서 사용할 아이콘 */
import {
  Bell,
  Bot,
  Boxes,
  ClipboardCheck,
  FileCheck2,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

/* 사이드바 위쪽에 표시할 메뉴 목록 */
const COMPLIANCE_MENU_ITEMS = [
  {
    label: "전사 대시보드",
    path: "/compliance/dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "AI 사용하기",
    path: "/compliance/ai-chat",
    icon: Bot,
    enabled: false,
  },
  {
    label: "위험 이벤트 관리",
    path: "/compliance/risk-events",
    icon: TriangleAlert,
    enabled: false,
  },
  {
    label: "규제 매핑",
    path: "/compliance/regulation-mapping",
    icon: Boxes,
    enabled: false,
  },
  {
    label: "내부결재용 보고서",
    path: "/compliance/reports",
    icon: FileText,
    enabled: false,
  },
  {
    label: "상시평가 증빙자료",
    path: "/compliance/evidence",
    icon: FileCheck2,
    enabled: false,
  },
  {
    label: "정책 관리",
    path: "/compliance/policies",
    icon: ClipboardCheck,
    enabled: false,
  },
];

function ComplianceSidebar() {
  /* 로그아웃 버튼을 눌렀을 때 로그인 페이지로 이동 */
  const navigate = useNavigate();

  /*
    아직 페이지가 만들어지지 않은 메뉴를 클릭하면
    임시 안내창을 표시한다.

    해당 페이지를 구현하고 Route까지 연결한 뒤에는
    enabled를 true로 바꾸면 된다.
  */
  const handlePreparingMenuClick = (menuName) => {
    alert(`${menuName} 페이지는 현재 구현 중입니다.`);
  };

  /*
    현재는 실제 로그인 정보 삭제 기능이 없기 때문에
    로그인 페이지로만 이동

    백엔드 인증이 연결되면 이 함수 안에서
    토큰이나 사용자 정보를 먼저 삭제해야 한다.
  */
  const handleLogout = () => {
    navigate("/login");
  };

  return (
    /* 컴플라이언스 담당자용 왼쪽 사이드바 전체 */
    <aside className="compliance-sidebar">
      {/* 서비스 로고 영역 */}
      <div className="compliance-sidebar-brand">
        {/* 서비스 방패 아이콘 */}
        <div className="compliance-sidebar-brand-icon">
          <ShieldCheck size={22} />
        </div>

        {/* 서비스 이름과 설명 */}
        <div className="compliance-sidebar-brand-text">
          <strong>ComplianceAI</strong>
          <span>AI 거버넌스 플랫폼</span>
        </div>
      </div>

      {/* 사이드바 위쪽 메뉴 */}
      <nav className="compliance-sidebar-nav">
        {COMPLIANCE_MENU_ITEMS.map((menuItem) => {
          /*
            메뉴 객체에 저장된 아이콘을
            실제 React 컴포넌트로 사용한다.
          */
          const MenuIcon = menuItem.icon;

          /*
            enabled가 true인 메뉴는
            실제 페이지로 이동할 수 있는 NavLink로 만든다.
          */
          if (menuItem.enabled) {
            return (
              <NavLink
                key={menuItem.path}
                to={menuItem.path}
                /*
                  현재 주소와 메뉴 주소가 일치하면
                  active 클래스를 적용한다.
                */
                className={({ isActive }) =>
                  isActive
                    ? "compliance-sidebar-menu active"
                    : "compliance-sidebar-menu"
                }
              >
                <MenuIcon size={18} />

                <span className="compliance-sidebar-menu-label">
                  {menuItem.label}
                </span>
              </NavLink>
            );
          }

          /* 아직 페이지가 구현되지 않은 메뉴는 버튼으로 표시 클릭하면 구현 중이라는 안내창이 나옴 */
          return (
            <button
              key={menuItem.label}
              type="button"
              className="compliance-sidebar-menu"
              onClick={() =>
                handlePreparingMenuClick(menuItem.label)
              }
            >
              <MenuIcon size={18} />

              <span className="compliance-sidebar-menu-label">
                {menuItem.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* 사이드바 아래쪽 영역 */}
      <div className="compliance-sidebar-bottom">
        {/* 
          현재 주소가 /compliance/notices이면
          active 클래스가 자동으로 적용된다.
        */}
        <NavLink
          to="/compliance/notices"
          className={({ isActive }) =>
            isActive
              ? "compliance-sidebar-notice-button active"
              : "compliance-sidebar-notice-button"
          }
        >
          {/* 공지사항 아이콘 */}
          <Bell size={18} />

          {/* 공지사항 글자 */}
          <span className="compliance-sidebar-notice-text">
            공지사항
          </span>

          {/* 읽지 않은 공지사항이 있다는 것을 나타내는 점 */}
          <span className="compliance-sidebar-notice-dot" />
        </NavLink>

        {/* 로그인 사용자 정보 */}
        <div className="compliance-sidebar-user">
          {/* 사용자 이름 첫 글자를 표시하는 원형 프로필 */}
          <div className="compliance-sidebar-user-avatar">
            김
          </div>

          {/* 사용자 이름과 소속 부서 */}
          <div className="compliance-sidebar-user-info">
            <strong>김준</strong>
            <span>준법감시부</span>
          </div>
        </div>

        {/* 현재 사용자의 역할 */}
        <span className="compliance-sidebar-role-badge">
          보안·컴플라이언스 담당자
        </span>

        {/* 로그아웃 버튼 */}
        <button
          type="button"
          className="compliance-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}

export default ComplianceSidebar;