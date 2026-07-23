/*
  현재 주소를 확인하기 위한 useLocation과
  중첩 Route의 페이지를 표시하기 위한 Outlet을 가져온다.
*/
import {
  Outlet,
  useLocation,
} from "react-router-dom";

/* 컴플라이언스 담당자용 사이드바와 상단 헤더 */
import ComplianceSidebar from "./ComplianceSidebar";
import ComplianceTopHeader from "./ComplianceTopHeader";

/* 컴플라이언스 레이아웃 전체에 적용되는 CSS */
import "./ComplianceLayout.css";

/* 현재 주소에 따라 상단 헤더에 표시할 제목 지정 */
const COMPLIANCE_PAGE_TITLES = {
  "/compliance/dashboard": "전사 대시보드",
  "/compliance/notices": "공지사항",
  "/compliance/ai-chat": "AI 사용하기",
  "/compliance/risk-events": "위험 이벤트 관리",
  "/compliance/regulation-mapping": "규제 매핑",
  "/compliance/reports": "내부결재용 보고서",
  "/compliance/evidence": "상시평가 증빙자료",
  "/compliance/policies": "정책 관리",
};

function ComplianceLayout() {
  /* 현재 브라우저 주소를 가져온다.

    예:
    /compliance/dashboard
  */
  const location = useLocation();

  /*
    현재 주소와 일치하는 페이지 제목을 가져온다.

    등록되지 않은 주소라면 기본 제목으로
    "컴플라이언스"를 표시한다.
  */
  const pageTitle =
    COMPLIANCE_PAGE_TITLES[location.pathname] ??
    "컴플라이언스";

  return (
    /* 컴플라이언스 담당자 화면 전체 구조 */
    <div className="compliance-layout">
      {/* 왼쪽 고정 사이드바 */}
      <ComplianceSidebar />

      {/* 사이드바를 제외한 오른쪽 전체 영역 */}
      <div className="compliance-layout-main">
        {/*
          현재 페이지 제목을 상단 헤더에 전달

          /compliance/dashboard에 접속하면
          "전사 대시보드"가 표시
        */}
        <ComplianceTopHeader title={pageTitle} />

        {/* 실제 페이지가 표시되는 영역 */}
        <main className="compliance-layout-content">
          {/*
            App.jsx에서 현재 주소와 연결된 페이지가
            이 Outlet 위치에 표시

            /compliance/dashboard
            → ComplianceDashboardPage
          */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default ComplianceLayout;