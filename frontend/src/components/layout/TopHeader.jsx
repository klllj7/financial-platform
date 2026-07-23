import { useState } from "react";
// 상단 사용자 정보 옆에 표시할 아래 방향 아이콘이다.
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

// AppLayout에서 전달한 title 값을 props로 받는다.
function TopHeader({ title }) {
  const navigate = useNavigate();

  // 내 정보 드롭다운 열림/닫힘 상태
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // localStorage에 저장된 로그인 사용자 정보 가져오기
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // 권한 코드를 화면에 보여줄 한글명으로 변환
  const roleLabelMap = {
    EMPLOYEE: "임직원",
    COMPLIANCE_MANAGER: "보안/컴플라이언스",
    ADMIN: "관리자",
  };

  const roleLabel = roleLabelMap[user?.role] || "사용자";
  const userName = user?.name || "사용자";
  const userEmail = user?.email || "-";
  const departmentName = user?.department?.name || user?.department || "-";

  // 프로필 영역 클릭시 드롭다운 열기/닫기
  const handleProfileClick = () => {
    setIsProfileOpen((prev) => !prev);
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    alert("로그아웃되었습니다.");
    navigate("/login");
  };

  return (
    <header className="top-header">
      {/* 현재 페이지 이름을 표시한다. */}
      <h1>{title}</h1>

      {/* 오른쪽 로그인 사용자 정보 영역 */}
      <div className="top-header-user-wrapper">
        <button
          type="button"
          className="top-header-user"
          onClick={handleProfileClick}
        >
          {/* 현재 사용자의 권한을 임시로 표시한다. */}
          <span className="user-role">{roleLabel}</span>
          {/* 개인정보 보호를 위해 이름 일부를 가린 형태다. */}
          <strong>{userName}</strong>
          {/* 추후 사용자 메뉴를 펼칠 때 사용할 아이콘이다. */}
          <ChevronDown 
            size={16}
            className={
              isProfileOpen ? "top-header-arrow open" : "top-header-arrow"
            } 
          />
        </button>
        
        {isProfileOpen && (
          <div className="top-header-dropdown">
            <div className="top-header-dropdown-profile">
              <div className="top-header-dropdown-avatar">
                <UserRound size={20} />
              </div>

              <div>
                <strong>{userName}</strong>
                <span>{roleLabel}</span>
              </div>
            </div>

            <div className="top-header-dropdown-info">
              <div>
                <span>이메일</span>
                <strong>{userEmail}</strong>
              </div>
              <div>
                <span>부서</span>
                <strong>{departmentName}</strong>
              </div>
            </div>

            <button
              type="button"
              className="top-header-logout-button"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopHeader;