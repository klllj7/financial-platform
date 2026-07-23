// 현재 주소 확인과 하위 페이지 출력을 위해 사용한다.
import {
  Outlet,
  useLocation,
} from "react-router-dom";

// 공통 사이드바와 상단 헤더
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

// 공통 레이아웃 CSS
import "./layout.css";

/* URL에 따라 상단 헤더에 표시할 제목 */
const PAGE_TITLES = {
  "/my-dashboard": "마이 대시보드",
  "/ai-chat": "AI 사용하기",
  "/notices": "공지사항",
  "/ai-tools": "AI Tool 신청",
  "/report/evidence": "상시평가 증빙자료",

  "/compliance/dashboard": "전사 대시보드",
  "/compliance/notices": "공지사항",
  
  "/admin/accounts": "계정 관리",
};

function AppLayout() {
  // 현재 브라우저 주소 정보를 가져온다.
  const location = useLocation();

  /*
    현재 주소에 맞는 제목을 사용하고,
    등록되지 않은 주소이면 서비스명을 표시한다.
  */
  const pageTitle =
    PAGE_TITLES[location.pathname] ?? "ComplianceAI";

  return (
    <div className="app-layout">
      {/* 왼쪽 고정 사이드바 */}
      <Sidebar />

      {/* 오른쪽 상단 헤더와 페이지 본문 */}
      <div className="app-main">
        <TopHeader title={pageTitle} />

        <main className="app-content">
          {/* 현재 주소에 해당하는 페이지가 표시되는 위치 */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;