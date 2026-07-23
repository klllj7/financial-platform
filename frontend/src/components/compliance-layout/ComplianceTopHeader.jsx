/* 사용자 메뉴가 있다는 것을 표시하는
  아래쪽 화살표 아이콘을 가져온다.
*/
import { ChevronDown } from "lucide-react";

/*
  title은 ComplianceLayout에서 전달받는다.

  예:
  <ComplianceTopHeader title="전사 대시보드" />
*/
function ComplianceTopHeader({ title }) {
  /*
    현재는 화면 디자인을 확인하는 단계이므로
    사용자 메뉴 기능 대신 임시 안내창을 표시한다.

    추후 로그인 사용자 메뉴가 구현되면
    드롭다운 메뉴를 여는 기능으로 변경하면 된다.
  */
  const handleUserMenuClick = () => {
    alert("사용자 메뉴는 추후 연결할 예정입니다.");
  };

  return (
    /* 컴플라이언스 담당자 화면의 상단 헤더 전체 */
    <header className="compliance-top-header">
      {/* 현재 페이지 제목 */}
      <h1 className="compliance-top-header-title">
        {title}
      </h1>

      {/* 로그인 사용자 정보 영역 */}
      <button
        type="button"
        className="compliance-top-user"
        onClick={handleUserMenuClick}
      >
        {/* 로그인 사용자의 역할을 보여주는 배지*/}
        <span className="compliance-top-role-badge">
          보안·컴플라이언스 담당자
        </span>

        {/*
          현재는 화면 확인용 임시 사용자 이름이다.

          로그인 API 연결 후 실제 사용자 이름으로
          교체하면 된다.
        */}
        <strong className="compliance-top-user-name">
          김준
        </strong>

        {/* 사용자 메뉴 펼치기 아이콘 */}
        <ChevronDown size={16} />
      </button>
    </header>
  );
}

export default ComplianceTopHeader;