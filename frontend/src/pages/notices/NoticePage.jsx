// 공지사항 Mock 데이터를 가져온다.
import { dashboardNoticeData } from "../../mocks/dashboardMock";

// 공지사항 페이지 전용 CSS
import "./NoticePage.css";

function NoticePage() {
  /*
    공지사항 데이터가 배열이 아닌 경우에도
    화면이 멈추지 않도록 빈 배열로 처리한다.
  */
  const notices = Array.isArray(dashboardNoticeData)
    ? dashboardNoticeData
    : [];

  return (
    <div className="notice-page">
      {/* 공지사항 페이지 제목 */}
      <header className="notice-page-heading">
        <h2>공지사항</h2>

        <p>
          서비스 운영, 정책 변경 및 보안 안내를 확인할 수 있습니다.
        </p>
      </header>

      {/* 전체 공지사항 목록 */}
      <section className="notice-page-card">
        {notices.map((notice) => (
          <article
            key={notice.id}
            className="notice-page-item"
          >
            <div className="notice-page-item-main">
              {/* 카테고리와 NEW 표시 */}
              <div className="notice-page-item-badges">
                <span className="notice-page-category">
                  {notice.category}
                </span>

                {notice.isNew && (
                  <span className="notice-page-new">
                    NEW
                  </span>
                )}
              </div>

              {/* 공지사항 제목 */}
              <strong>{notice.title}</strong>

              {/* 공지사항 내용 */}
              <p>{notice.content}</p>
            </div>

            {/* 공지사항 등록일 */}
            <time>{notice.createdAt}</time>
          </article>
        ))}
      </section>
    </div>
  );
}

export default NoticePage;