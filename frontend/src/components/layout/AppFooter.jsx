import { Link } from "react-router-dom";
import "./AppFooter.css";

function AppFooter() {
  return (
    /*
      모든 화면 하단에서 공통으로 사용하는 Footer 컴포넌트
      개인정보처리방침 같은 정책성 문구는 화면마다 중복 작성하지 않고 공통 컴포넌트로 관리
    */
    <footer className="app-footer">
      <div className="app-footer-inner">
        <p className="app-footer-copy">
          © 2026 ReguPilot. All rights reserved.
        </p>

        <div className="app-footer-links">
          {/* 개인정보처리방침 페이지로 이동 */}
          <Link to="/privacy-policy">개인정보처리방침</Link>
          <span className="app-footer-divider">|</span>

          {/* 현재는 실제 이용약관 페이지가 없으므로 텍스트만 표시 */}
          <Link to="/terms-of-service">서비스 이용약관</Link>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;