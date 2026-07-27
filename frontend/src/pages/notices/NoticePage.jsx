import { useEffect, useState } from "react";
import { getNotices } from "../../api/noticeApi";

// 공지사항 페이지 전용 CSS
import "./NoticePage.css";

function NoticePage() {
  // 백엔드에서 조회한 공지사항만 화면에 표시한다.
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await getNotices();
        setNotices(Array.isArray(response.data) ? response.data : []);
      } catch (requestError) {
        console.error("공지사항 조회 실패", requestError);
        setError("공지사항을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, []);

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
        {isLoading && <div className="notice-page-item">공지사항을 불러오고 있습니다.</div>}
        {error && <div className="notice-page-item">{error}</div>}
        {!isLoading && !error && notices.length === 0 && (
          <div className="notice-page-item">등록된 공지사항이 없습니다.</div>
        )}
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

                {new Date(notice.createdAt).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000 && (
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
            <time>{new Date(notice.createdAt).toLocaleDateString("ko-KR")}</time>
          </article>
        ))}
      </section>
    </div>
  );
}

export default NoticePage;
