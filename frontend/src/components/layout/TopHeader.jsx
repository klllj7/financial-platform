// 상단 사용자 정보 옆에 표시할 아래 방향 아이콘이다.
import { ChevronDown } from "lucide-react";

// AppLayout에서 전달한 title 값을 props로 받는다.
function TopHeader({ title }) {
  return (
    <header className="top-header">
      {/* 현재 페이지 이름을 표시한다. */}
      <h1>{title}</h1>

      {/* 오른쪽 로그인 사용자 정보 영역 */}
      <div className="top-header-user">
        {/* 현재 사용자의 권한을 임시로 표시한다. */}
        <span className="user-role">임직원</span>

        {/* 개인정보 보호를 위해 이름 일부를 가린 형태다. */}
        <strong>정*윤</strong>

        {/* 추후 사용자 메뉴를 펼칠 때 사용할 아이콘이다. */}
        <ChevronDown size={16} />
      </div>
    </header>
  );
}

export default TopHeader;