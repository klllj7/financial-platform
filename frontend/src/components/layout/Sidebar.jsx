import { useEffect, useState } from "react";

/* 사이드바에서 사용할 아이콘 */
import {
  Bell,
  Bot,
  Boxes,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
 
/*
  NavLink는 메뉴 이동과 활성 메뉴 표시를 담당
  useNavigate는 로그아웃 후 로그인 페이지 이동에 사용한다.
*/
import {
  NavLink,
  useNavigate,
} from "react-router-dom";
import { getNotices } from "../../api/noticeApi";
import {
  hasUnreadNotices,
  subscribeNoticeReadState,
} from "../../utils/noticeReadState";
 
/* 역할별 사이드바 메뉴 */
const ROLE_MENUS = {
  EMPLOYEE: [
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
    {
      to: "/ai-tools",
      label: "AI Tool 신청",
      icon: Boxes,
    },
  ],
 
  COMPLIANCE_MANAGER: [
    {
      to: "/compliance/dashboard",
      label: "전사 대시보드",
      icon: LayoutDashboard,
    },
    {
      to: "/compliance/risk-events",
      label: "위험 이벤트 관리",
      icon: ShieldAlert,
    },
    {
      to: "/ai-chat",
      label: "AI 사용하기",
      icon: Bot,
    },
    {
      to: "/ai-tools",
      label: "AI Tool 신청",
      icon: Boxes,
    },
    {
      to: "/compliance/evidence",
      label: "상시평가 증빙자료",
      icon: ClipboardCheck,
    },
    {
      to: "/compliance/report",
      label: "내부결재 보고서",
      icon: FileText,
    },
    {
      to: "/policies",
      label: "정책 관리",
      icon: ShieldCheck,
    },
    {
      to: "/regulations",
      label: "규제 관리",
      icon: FileText,
    },
  ],
 
  ADMIN: [
    {
      to: "/admin/dashboard",
      label: "전사 대시보드",
      icon: LayoutDashboard,
    },
    {
      to: "/admin/accounts",
      label: "계정 관리",
      icon: UsersRound,
    },
    {
      to: "/ai-chat",
      label: "AI 사용하기",
      icon: Bot,
    },
    {
      to: "/admin/models",
      label: "AI 모델 관리",
      icon: Bot,
    },
    {
      to: "/admin/policies",
      label: "정책 승인 관리",
      icon: FileText,
    },
  ],
};
 
/*
  로그인 사용자 정보가 손상되거나 이전 형식으로 저장된 경우에도
  사이드바 전체가 멈추지 않도록 안전하게 JSON을 변환한다.
*/
const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");
 
  if (!storedUser) {
    return null;
  }
 
  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("저장된 로그인 사용자 정보를 읽지 못했습니다.", error);
    return null;
  }
};
 
function Sidebar() {
  // 함수 안에서 페이지를 이동하기 위해 사용한다.
  const navigate = useNavigate();
 
  // localStorage에 저장된 로그인 사용자 정보를 안전하게 가져온다.
  const user = getStoredUser();
  
 
  const roleCode = user?.role?.code || user?.role || "EMPLOYEE";  // 사용자 역할
  const userName = user?.name || "사용자";     // 사용자 이름
  const [hasUnreadNotice, setHasUnreadNotice] = useState(false);
 
  // 사용자 이름 첫 글자
  const userInitial = userName.charAt(0);
 
  // 부서명
  // department가 객체일 수도 있고 문자열일 수도 있어서 둘다 대응
  const departmentName = user?.department?.name || user?.department || "-";
 
  
  // 등록되지 않은 역할이 들어오면 임직원 메뉴를 기본값으로 사용
  const menus = ROLE_MENUS[roleCode] ?? ROLE_MENUS.EMPLOYEE;
 
  const noticePath =
    roleCode === "COMPLIANCE_MANAGER"
      ? "/compliance/notices"
      : roleCode === "EMPLOYEE"
        ? "/notices"
        : roleCode === "ADMIN"
          ? "/compliance/notices"
          : null;

  useEffect(() => {
    let noticeItems = [];

    const updateUnreadState = () => {
      setHasUnreadNotice(hasUnreadNotices(noticeItems));
    };

    getNotices()
      .then((response) => {
        noticeItems = Array.isArray(response.data) ? response.data : [];
        updateUnreadState();
      })
      .catch((error) => {
        console.error("사이드바 공지사항 읽음 상태 조회 실패", error);
        setHasUnreadNotice(false);
      });

    return subscribeNoticeReadState(updateUnreadState);
  }, [roleCode]);
 
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
          <strong>ReguPilot</strong>
          <span>AI 거버넌스 플랫폼</span>
        </div>
      </div>
 
      {/* 상단 주요 메뉴 */}
      <nav className="sidebar-menu">
        {menus.map((menu) => {
          const Icon = menu.icon;
 
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
        {noticePath && (
          <NavLink
            to={noticePath}
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
 
            {hasUnreadNotice && <span className="notice-dot" />}
          </NavLink>
        )}
        
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
