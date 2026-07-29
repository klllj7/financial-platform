import { Outlet } from "react-router-dom";
import AppFooter from "./AppFooter";

// 공통 레이아웃 CSS
import "./layout.css";

function AuthLayout() {
  return (
    /* 
      로그인 전 인증 화면에서 공통으로 사용하는 레이아웃
      로그인, 회원가입, 아이디 찾기, 비밀번호 찾기, 비밀번호 재설정 화면
    */

    <main className="auth-layout">
      <div className="auth-layout-content">
        {/* App.jsx에서 AuthLayout 하위에 등록한 페이지가 이 위치에 렌더링 */}
        <Outlet />
      </div>

      {/* 인증 화면 공통 Footer */}
      <AppFooter />
    </main>
  );
}

export default AuthLayout;