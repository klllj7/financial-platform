// React Router에서 사용할 컴포넌트를 가져온다.
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// 로그인과 회원가입 페이지
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";

// 임직원용 공통 레이아웃
import AppLayout from "./components/layout/AppLayout";

// 임직원용 기능 페이지
import AiChatPage from "./pages/ai-chat/AiChatPage";
import MyDashboardPage from "./pages/my-dashboard/MyDashboardPage";
import NoticePage from "./pages/notices/NoticePage";
import AiToolsPage from "./pages/ai-tools/AiToolsPage";
import EvidenceChecklistPage from "./pages/report/EvidenceChecklistPage";

// 컴플라이언스 담당자용 전사 대시보드
import ComplianceDashboardPage from "./pages/compliance/dashboard/ComplianceDashboardPage";
import ComplianceNoticePage from "./pages/compliance/notices/ComplianceNoticePage";
import ComplianceRiskEventsPage from "./pages/compliance/risk-events/ComplianceRiskEventsPage";
import ComplianceModelApplicationsPage from "./pages/compliance/model-applications/ComplianceModelApplicationsPage";

// 관리자 기능 페이지
import AdminAccountPage from "./pages/admin/AdminAccountPage";
import AdminModelPage from "./pages/admin/AdminModelPage";

// 정책 관리 페이지
import PolicyManagementPage from "./pages/policy/PolicyManagementPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 처음 접속하면 로그인 페이지로 이동한다. */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* ==================================================
            로그인 및 회원가입
        ================================================== */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        {/* ==================================================
            임직원용 페이지

            AppLayout 내부에 있는 페이지에는
            임직원용 사이드바와 상단 헤더가 표시된다.
        ================================================== */}

        <Route element={<AppLayout />}>
          {/* 임직원 마이 대시보드 */}
          <Route
            path="/my-dashboard"
            element={<MyDashboardPage />}
          />

          {/* 임직원 AI 사용하기 */}
          <Route
            path="/ai-chat"
            element={<AiChatPage />}
          />

          {/*
            임직원용 공지사항

            임직원은 등록된 공지를 조회하는 용도로 사용한다.
          */}
          <Route
            path="/notices"
            element={<NoticePage />}
          />

          {/* 임직원 AI Tool 신청 및 신청 현황 */}
          <Route
            path="/ai-tools"
            element={<AiToolsPage />}
          />

          {/* 컴플라이언스 대시보드 */}
          <Route
            path="/compliance/dashboard"
            element={<ComplianceDashboardPage />}
          />

          {/* 컴플라이언스 공지사항 */}
          <Route
            path="/compliance/notices"
            element={<ComplianceNoticePage />}
          />

          <Route
            path="/compliance/risk-events"
            element={<ComplianceRiskEventsPage />}
          />

          <Route
            path="/compliance/model-applications"
            element={<ComplianceModelApplicationsPage />}
          />

          {/* 상시평가 증빙자료 */}
          <Route
            path="/report/evidence"
            element={<EvidenceChecklistPage />}
          />

          {/* 관리자 - 계정 관리 */}
          <Route
            path="/admin/accounts"
            element={<AdminAccountPage />}
          />

          {/* 관리자 - AI 모델 관리 */}
          <Route
            path="/admin/models"
            element={<AdminModelPage />}
          />

          {/* 컴플라이언스 전사 대시보드 */}
          <Route
            path="/compliance/dashboard"
            element={<ComplianceDashboardPage />}
          />

          {/*
            컴플라이언스 담당자용 공지사항

            공지사항 조회뿐만 아니라
            새로운 공지 작성 기능도 포함된다.
          */}
          <Route
            path="/compliance/notices"
            element={<ComplianceNoticePage />}
          />

          {/* 정책 관리 페이지 */}
          <Route
            path="/policies"
            element={<PolicyManagementPage />}
          />

          {/* 상시평가 증빙자료 (컴플라이언스) */}
          <Route
            path="/compliance/evidence"
            element={<EvidenceChecklistPage />}
          />
        </Route>

        {/* ==================================================
            존재하지 않는 주소 처리
        ==================================================*/}

        {/*
          현재 등록되지 않은 주소로 접근하면
          로그인 페이지로 이동한다.
        */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
