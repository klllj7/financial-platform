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
import EventListPage from "./pages/compliance/events/EventListPage";

// 로그인 후 공통 레이아웃
import AppLayout from "./components/layout/AppLayout";

// 각 기능 페이지
import AiChatPage from "./pages/ai-chat/AiChatPage";
import MyDashboardPage from "./pages/my-dashboard/MyDashboardPage";
import NoticePage from "./pages/notices/NoticePage";
import AiToolsPage from "./pages/ai-tools/AiToolsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 처음 접속하면 로그인 페이지로 이동한다. */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* 로그인과 회원가입 */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        {/*
          AppLayout 내부의 페이지에는
          공통 사이드바와 상단 헤더가 표시된다.
        */}
        <Route element={<AppLayout />}>

          {/* 로그인 후 첫 화면 */}
          <Route
            path="/my-dashboard"
            element={<MyDashboardPage />}
          />

          {/* AI 사용하기 */}
          <Route
            path="/ai-chat"
            element={<AiChatPage />}
          />

          {/* 공지사항 전체 보기 */}
          <Route
            path="/notices"
            element={<NoticePage />}
          />

          {/* AI Tool 신청과 내 신청 현황 */}
          <Route
            path="/ai-tools"
            element={<AiToolsPage />}
          />
        </Route>

        {/*
          컴플라이언스 담당자 페이지.
          ComplianceLayout이 아직 준비 중이라 임시로 레이아웃 없이 둔다.
          ComplianceLayout이 합쳐지면 AppLayout처럼
          <Route element={<ComplianceLayout />}> 안으로 옮겨야 한다.
        */}
        <Route
          path="/compliance/events"
          element={<EventListPage />}
        />

        {/* 존재하지 않는 주소로 접근하면 로그인 페이지로 이동 */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;