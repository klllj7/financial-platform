import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import EventListPage from "./pages/dlp/EventListPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 기본 주소로 들어오면 /login으로 이동 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 로그인 페이지 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 회원가입 페이지 */}
        <Route path="/signup" element={<SignupPage />} />

        {/* 위험 이벤트 관리 페이지 */}
        <Route path="/dlp/events" element={<EventListPage />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;