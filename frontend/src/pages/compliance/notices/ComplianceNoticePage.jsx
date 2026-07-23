/*
  공지사항 목록과 작성 폼 상태를 관리하기 위해
  React의 useEffect와 useState를 가져온다.
*/
import {
  useEffect,
  useState,
} from "react";

/*
  공지사항 페이지에서 사용할 아이콘이다.
*/
import {
  Bell,
  Megaphone,
  Pin,
  Plus,
  Search,
  X,
} from "lucide-react";

/*
  컴플라이언스 공지사항 전용 CSS다.
*/
import "./ComplianceNoticePage.css";


/*
  백엔드 연결 전 화면 확인에 사용할 기본 공지사항이다.

  localStorage에 저장된 공지사항이 없을 때
  아래 데이터가 처음 화면에 표시된다.
*/
const INITIAL_NOTICE_DATA = [
  {
    id: 1,
    category: "정책",
    title: "생성형 AI 사용 정책 개정 안내",
    content:
      "생성형 AI 사용 시 개인정보 및 고객정보 입력 제한 기준이 변경되었습니다. 개정된 정책을 확인해 주세요.",
    author: "김준",
    department: "준법감시부",
    createdAt: "2026-07-23",
    isPinned: true,
  },
  {
    id: 2,
    category: "보안",
    title: "고객정보 포함 프롬프트 입력 금지 안내",
    content:
      "고객명, 주민등록번호, 계좌번호 등 개인정보가 포함된 내용을 외부 AI 서비스에 입력할 수 없습니다.",
    author: "김준",
    department: "준법감시부",
    createdAt: "2026-07-22",
    isPinned: true,
  },
  {
    id: 3,
    category: "시스템",
    title: "AI Gateway 정기 점검 안내",
    content:
      "AI Gateway 정기 점검으로 일부 AI 서비스 이용이 일시적으로 제한될 수 있습니다.",
    author: "박관리",
    department: "IT운영팀",
    createdAt: "2026-07-20",
    isPinned: false,
  },
];


/*
  새 공지사항 작성 폼의 초기값이다.

  작성 완료 또는 취소 시
  이 값으로 폼을 다시 초기화한다.
*/
const INITIAL_FORM = {
  category: "정책",
  title: "",
  content: "",
  isPinned: false,
};


/*
  localStorage에서 사용할 이름이다.

  다른 데이터와 구분하기 위해
  컴플라이언스 공지사항 전용 이름을 사용한다.
*/
const STORAGE_KEY = "compliance-notices";


function ComplianceNoticePage() {
  /*
    화면에 표시할 전체 공지사항 목록이다.

    함수 형태로 초기값을 넣으면
    컴포넌트가 처음 만들어질 때 한 번만 실행된다.
  */
  const [notices, setNotices] = useState(() => {
    /*
      이전에 localStorage에 저장된 공지사항을 가져온다.
    */
    const savedNotices =
      localStorage.getItem(STORAGE_KEY);

    /*
      저장된 데이터가 있다면 JSON 형태에서
      JavaScript 배열로 변환해서 사용한다.
    */
    if (savedNotices) {
      try {
        return JSON.parse(savedNotices);
      } catch (error) {
        /*
          저장된 데이터가 손상된 경우
          기본 공지사항을 사용한다.
        */
        console.error(
          "저장된 공지사항을 불러오지 못했습니다.",
          error,
        );
      }
    }

    /*
      저장된 데이터가 없다면
      기본 Mock 데이터를 사용한다.
    */
    return INITIAL_NOTICE_DATA;
  });

  /*
    공지사항 작성 모달의 열림 여부다.

    false:
    모달이 닫힌 상태

    true:
    모달이 열린 상태
  */
  const [isWriteModalOpen, setIsWriteModalOpen] =
    useState(false);

  /*
    공지사항 작성 폼의 입력값이다.
  */
  const [noticeForm, setNoticeForm] =
    useState(INITIAL_FORM);

  /*
    공지사항 검색어다.
  */
  const [searchKeyword, setSearchKeyword] =
    useState("");

  /*
    공지사항 목록이 변경될 때마다
    변경된 목록을 localStorage에 저장한다.

    현재는 백엔드가 없기 때문에 사용하는 임시 방식이다.
  */
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notices),
    );
  }, [notices]);

  /*
    입력창의 name을 기준으로
    공지사항 작성 폼 값을 변경한다.

    일반 입력창과 체크박스를 모두 처리할 수 있다.
  */
  const handleFormChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setNoticeForm((previousForm) => ({
      ...previousForm,

      /*
        체크박스이면 checked 값을 사용하고,
        나머지 입력창이면 value를 사용한다.
      */
      [name]: type === "checkbox"
        ? checked
        : value,
    }));
  };

  /*
    공지사항 작성 버튼을 눌렀을 때
    작성 모달을 연다.
  */
  const handleOpenWriteModal = () => {
    setNoticeForm(INITIAL_FORM);
    setIsWriteModalOpen(true);
  };

  /*
    취소 버튼이나 X 버튼을 눌렀을 때
    작성 모달을 닫고 입력값을 초기화한다.
  */
  const handleCloseWriteModal = () => {
    setNoticeForm(INITIAL_FORM);
    setIsWriteModalOpen(false);
  };

  /*
    공지사항 등록 폼을 제출했을 때 실행한다.
  */
  const handleSubmitNotice = (event) => {
    /*
      form 제출 시 브라우저가 새로고침되는
      기본 동작을 막는다.
    */
    event.preventDefault();

    /*
      제목의 앞뒤 공백을 제거한다.
    */
    const trimmedTitle =
      noticeForm.title.trim();

    /*
      내용의 앞뒤 공백을 제거한다.
    */
    const trimmedContent =
      noticeForm.content.trim();

    /*
      제목이 입력되지 않았다면
      공지사항을 등록하지 않는다.
    */
    if (!trimmedTitle) {
      alert("공지사항 제목을 입력해 주세요.");
      return;
    }

    /*
      내용이 입력되지 않았다면
      공지사항을 등록하지 않는다.
    */
    if (!trimmedContent) {
      alert("공지사항 내용을 입력해 주세요.");
      return;
    }

    /*
      오늘 날짜를 YYYY-MM-DD 형식으로 만든다.

      예:
      2026-07-23
    */
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    /*
      새로 등록할 공지사항 객체다.

      현재 사용자 이름과 부서는
      화면 확인용 임시 데이터다.
    */
    const newNotice = {
      id: Date.now(),
      category: noticeForm.category,
      title: trimmedTitle,
      content: trimmedContent,
      author: "김준",
      department: "준법감시부",
      createdAt: today,
      isPinned: noticeForm.isPinned,
    };

    /*
      새 공지사항을 기존 목록의 가장 위에 추가한다.
    */
    setNotices((previousNotices) => [
      newNotice,
      ...previousNotices,
    ]);

    /*
      작성 완료 후 모달을 닫는다.
    */
    handleCloseWriteModal();

    alert("공지사항이 등록되었습니다.");
  };

  /*
    검색어를 기준으로 화면에 표시할
    공지사항 목록을 만든다.

    제목, 내용, 카테고리 중 하나라도 검색어를 포함하면
    검색 결과에 표시한다.
  */
  const filteredNotices = notices.filter(
    (notice) => {
      const normalizedKeyword =
        searchKeyword.trim().toLowerCase();

      /*
        검색어가 비어 있으면
        전체 공지사항을 표시한다.
      */
      if (!normalizedKeyword) {
        return true;
      }

      return (
        notice.title
          .toLowerCase()
          .includes(normalizedKeyword) ||
        notice.content
          .toLowerCase()
          .includes(normalizedKeyword) ||
        notice.category
          .toLowerCase()
          .includes(normalizedKeyword)
      );
    },
  );

  /*
    고정 공지사항을 먼저 표시하고,
    그 다음 일반 공지사항을 표시한다.
  */
  const sortedNotices = [
    ...filteredNotices,
  ].sort((firstNotice, secondNotice) => {
    if (
      firstNotice.isPinned ===
      secondNotice.isPinned
    ) {
      return (
        secondNotice.id -
        firstNotice.id
      );
    }

    return firstNotice.isPinned
      ? -1
      : 1;
  });

  return (
    <div className="compliance-notice-page">
      {/* ==================================================
          페이지 제목과 공지 작성 버튼
      ================================================== */}
      <header className="compliance-notice-heading">
        <div>
          <h2>공지사항</h2>

          <p>
            전사 임직원에게 전달할 정책 및 시스템
            공지사항을 작성하고 관리합니다.
          </p>
        </div>

        {/*
          컴플라이언스 담당자만 사용하는
          공지사항 작성 버튼이다.
        */}
        <button
          type="button"
          className="compliance-notice-write-button"
          onClick={handleOpenWriteModal}
        >
          <Plus size={17} />
          공지 작성
        </button>
      </header>

      {/* ==================================================
          공지사항 안내 카드
      ================================================== */}
      <section className="compliance-notice-guide">
        <div className="compliance-notice-guide-icon">
          <Megaphone size={22} />
        </div>

        <div>
          <strong>
            중요 정책은 상단 고정 공지로 등록해 주세요.
          </strong>

          <p>
            등록된 공지는 임직원 공지사항 화면에도
            동일하게 제공될 예정입니다.
          </p>
        </div>
      </section>

      {/* ==================================================
          공지사항 목록 카드
      ================================================== */}
      <section className="compliance-notice-panel">
        {/* 목록 제목과 검색 영역 */}
        <div className="compliance-notice-panel-header">
          <div className="compliance-notice-panel-title">
            <Bell size={18} />

            <h3>전체 공지사항</h3>

            <span>
              총 {filteredNotices.length}건
            </span>
          </div>

          {/* 공지사항 검색창 */}
          <label className="compliance-notice-search">
            <Search size={16} />

            <input
              type="search"
              value={searchKeyword}
              placeholder="공지사항 검색"
              onChange={(event) =>
                setSearchKeyword(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        {/* 공지사항 목록 */}
        {sortedNotices.length > 0 ? (
          <div className="compliance-notice-list">
            {sortedNotices.map((notice) => (
              <article
                key={notice.id}
                className="compliance-notice-card"
              >
                {/* 카테고리, 고정 상태, 날짜 */}
                <div className="compliance-notice-card-top">
                  <div>
                    <span className="compliance-notice-category">
                      {notice.category}
                    </span>

                    {notice.isPinned && (
                      <span className="compliance-notice-pinned">
                        <Pin size={11} />
                        중요
                      </span>
                    )}
                  </div>

                  <time>
                    {notice.createdAt}
                  </time>
                </div>

                {/* 공지사항 제목 */}
                <h4>{notice.title}</h4>

                {/* 공지사항 내용 */}
                <p>{notice.content}</p>

                {/* 공지사항 작성자 */}
                <footer>
                  작성자 {notice.author} ·{" "}
                  {notice.department}
                </footer>
              </article>
            ))}
          </div>
        ) : (
          /*
            검색 결과가 없는 경우 표시할 화면이다.
          */
          <div className="compliance-notice-empty">
            <Bell size={28} />

            <strong>
              검색 결과가 없습니다.
            </strong>

            <p>
              다른 검색어를 입력해 주세요.
            </p>
          </div>
        )}
      </section>

      {/* ==================================================
          공지사항 작성 모달
      ================================================== */}
      {isWriteModalOpen && (
        /*
          모달 바깥쪽의 어두운 배경이다.
        */
        <div
          className="compliance-notice-modal-backdrop"
          role="presentation"
        >
          {/*
            실제 공지사항 작성 창이다.
          */}
          <section
            className="compliance-notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-write-title"
          >
            {/* 모달 제목 영역 */}
            <header className="compliance-notice-modal-header">
              <div>
                <h3 id="notice-write-title">
                  공지사항 작성
                </h3>

                <p>
                  임직원에게 전달할 공지 내용을
                  입력해 주세요.
                </p>
              </div>

              {/* 모달 닫기 버튼 */}
              <button
                type="button"
                aria-label="공지사항 작성 창 닫기"
                onClick={handleCloseWriteModal}
              >
                <X size={19} />
              </button>
            </header>

            {/* 공지사항 작성 폼 */}
            <form
              className="compliance-notice-form"
              onSubmit={handleSubmitNotice}
            >
              {/* 공지사항 카테고리 */}
              <label className="compliance-notice-field">
                <span>카테고리</span>

                <select
                  name="category"
                  value={noticeForm.category}
                  onChange={handleFormChange}
                >
                  <option value="정책">
                    정책
                  </option>

                  <option value="보안">
                    보안
                  </option>

                  <option value="시스템">
                    시스템
                  </option>

                  <option value="교육">
                    교육
                  </option>

                  <option value="일반">
                    일반
                  </option>
                </select>
              </label>

              {/* 공지사항 제목 */}
              <label className="compliance-notice-field">
                <span>
                  제목
                  <em>*</em>
                </span>

                <input
                  type="text"
                  name="title"
                  value={noticeForm.title}
                  maxLength={100}
                  placeholder="공지사항 제목을 입력해 주세요."
                  onChange={handleFormChange}
                />

                <small>
                  {noticeForm.title.length} / 100
                </small>
              </label>

              {/* 공지사항 내용 */}
              <label className="compliance-notice-field">
                <span>
                  내용
                  <em>*</em>
                </span>

                <textarea
                  name="content"
                  value={noticeForm.content}
                  maxLength={1000}
                  rows={8}
                  placeholder="공지사항 내용을 입력해 주세요."
                  onChange={handleFormChange}
                />

                <small>
                  {noticeForm.content.length} / 1000
                </small>
              </label>

              {/* 중요 공지 상단 고정 여부 */}
              <label className="compliance-notice-checkbox">
                <input
                  type="checkbox"
                  name="isPinned"
                  checked={noticeForm.isPinned}
                  onChange={handleFormChange}
                />

                <span>
                  중요 공지로 상단에 고정
                </span>
              </label>

              {/* 취소 및 등록 버튼 */}
              <div className="compliance-notice-form-actions">
                <button
                  type="button"
                  className="compliance-notice-cancel-button"
                  onClick={handleCloseWriteModal}
                >
                  취소
                </button>

                <button
                  type="submit"
                  className="compliance-notice-submit-button"
                >
                  공지 등록
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default ComplianceNoticePage;