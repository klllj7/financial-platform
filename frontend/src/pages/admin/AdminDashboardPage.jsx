import ComplianceDashboardPage from "../compliance/dashboard/ComplianceDashboardPage";
import "./AdminDashboardPage.css";

/*
  관리자 전용 대시보드 진입 페이지다.

  현재는 보안 컴플라이언스 전사 대시보드와 같은 화면을 사용하지만,
  관리자 전용 기능이 필요해지면 이 컴포넌트 안에서 별도로 확장한다.
  App.jsx의 관리자 라우트는 컴플라이언스 페이지가 아닌 이 파일을 사용한다.
*/
function AdminDashboardPage() {
  return (
    <div className="admin-dashboard-page">
      <ComplianceDashboardPage />
    </div>
  );
}

export default AdminDashboardPage;
