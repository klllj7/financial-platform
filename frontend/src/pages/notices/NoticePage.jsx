import { useEffect, useState } from "react";
import { Bell, Search, X } from "lucide-react";
import { getNotices } from "../../api/noticeApi";
import {
  getReadNoticeIds,
  markNoticeAsRead,
} from "../../utils/noticeReadState";

// 공지사항 페이지 전용 CSS
import "./NoticePage.css";

const DEFAULT_NOTICE_CATEGORIES = ["정책", "보안", "시스템", "교육", "일반"];

function NoticePage() {
  // 백엔드에서 조회한 공지사항만 화면에 표시한다.
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchScope, setSearchScope] = useState("TITLE");
  const readNoticeIds = getReadNoticeIds();
  const categoryOptions = [
    ...new Set([
      ...DEFAULT_NOTICE_CATEGORIES,
      ...notices.map((notice) => notice.category).filter(Boolean),
    ]),
  ];
  const filteredNotices = notices.filter((notice) => {
    const keyword = searchKeyword.trim().toLowerCase();
    const matchesCategory =
      categoryFilter === "ALL" || notice.category === categoryFilter;
    const title = String(notice.title || "").toLowerCase();
    const content = String(notice.content || "").toLowerCase();
    const matchesKeyword = !keyword || (
      searchScope === "TITLE"
        ? title.includes(keyword)
        : searchScope === "CONTENT"
          ? content.includes(keyword)
          : title.includes(keyword) || content.includes(keyword)
    );

    return matchesCategory && matchesKeyword;
  });

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await getNotices();
        const loadedAt = Date.now();
        const noticeData = Array.isArray(response.data) ? response.data : [];
        setNotices(
          [...noticeData]
            .sort((firstNotice, secondNotice) => {
              if (
                Boolean(firstNotice.isPinned) !==
                Boolean(secondNotice.isPinned)
              ) {
                return Number(Boolean(secondNotice.isPinned)) -
                  Number(Boolean(firstNotice.isPinned));
              }

              return new Date(secondNotice.createdAt).getTime() -
                new Date(firstNotice.createdAt).getTime();
            })
            .map((notice) => ({
              ...notice,
              isPinned: Boolean(notice.isPinned),
              isNew:
                new Date(notice.createdAt).toDateString() ===
                new Date(loadedAt).toDateString(),
            })),
        );
      } catch (requestError) {
        console.error("공지사항 조회 실패", requestError);
        setError("공지사항을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const openNotice = (notice) => {
    markNoticeAsRead(notice.id);
    setSelectedNotice(notice);
  };

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
        <div className="notice-page-filter-bar">
          <div className="notice-page-panel-title">
            <Bell size={18} />
            <h3>전체 공지사항</h3>
            <span>총 {filteredNotices.length}건</span>
          </div>
          <div className="notice-page-filters">
            <label className="notice-page-category-filter">
              <span>카테고리</span>
              <select
                id="noticeCategoryFilter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="ALL">전체 카테고리</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <form
              className="notice-page-search-controls"
              onSubmit={(event) => {
                event.preventDefault();
                setSearchKeyword(searchInput);
              }}
            >
              <select
                value={searchScope}
                aria-label="공지사항 검색 범위"
                onChange={(event) => setSearchScope(event.target.value)}
              >
                <option value="TITLE">제목만</option>
                <option value="CONTENT">내용만</option>
                <option value="ALL">제목+내용</option>
              </select>
              <label className="notice-page-search">
                <input
                  type="search"
                  value={searchInput}
                  placeholder="검색어를 입력해주세요"
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                <button type="submit" aria-label="공지사항 검색">
                  <Search size={19} />
                </button>
              </label>
            </form>
          </div>
        </div>
        {isLoading && <div className="notice-page-item">공지사항을 불러오고 있습니다.</div>}
        {error && <div className="notice-page-item">{error}</div>}
        {!isLoading && !error && notices.length === 0 && (
          <div className="notice-page-item">등록된 공지사항이 없습니다.</div>
        )}
        {!isLoading && !error && notices.length > 0 && filteredNotices.length === 0 && (
          <div className="notice-page-empty">
            <Bell size={28} />
            <strong>검색 결과가 없습니다.</strong>
            <p>다른 검색어나 카테고리를 선택해 주세요.</p>
          </div>
        )}
        {filteredNotices.map((notice) => (
          <article
            key={notice.id}
            className={`notice-page-item ${
              notice.isPinned ? "is-pinned" : ""
            } ${readNoticeIds.has(String(notice.id)) ? "" : "is-unread"}`}
            role="button"
            tabIndex={0}
            onClick={() => openNotice(notice)}
            onKeyDown={(event) => {
              if (["Enter", " "].includes(event.key)) {
                event.preventDefault();
                openNotice(notice);
              }
            }}
          >
            <div className="notice-page-item-top">
              <div className="notice-page-item-badges">
                <span className="notice-page-category">
                  {notice.category}
                </span>

                <strong className="notice-page-item-title">
                  {notice.title}
                </strong>

                {notice.isNew && (
                  <span className="notice-page-new">
                    NEW
                  </span>
                )}
              </div>
              <div className="notice-page-item-status">
                <time>{new Date(notice.createdAt).toLocaleDateString("ko-KR")}</time>
                {!readNoticeIds.has(String(notice.id)) && (
                  <span
                    className="notice-page-unread-dot"
                    aria-label="읽지 않은 공지사항"
                    title="읽지 않은 공지사항"
                  />
                )}
              </div>
            </div>

          </article>
        ))}
      </section>

      {selectedNotice && (
        <div
          className="notice-detail-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotice(null);
            }
          }}
        >
          <section
            className="notice-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-detail-title"
          >
            <header>
              <div className="notice-detail-badges">
                <span className="notice-page-category">
                  {selectedNotice.category}
                </span>
              </div>
              <button
                type="button"
                aria-label="공지사항 상세 창 닫기"
                onClick={() => setSelectedNotice(null)}
              >
                <X size={19} />
              </button>
            </header>
            <div className="notice-detail-content">
              <h3 id="notice-detail-title">{selectedNotice.title}</h3>
              <div className="notice-detail-meta">
                <span>
                  작성자 {selectedNotice.authorName || "관리자"}
                </span>
                <time>
                  {new Date(selectedNotice.createdAt).toLocaleDateString(
                    "ko-KR",
                  )}
                </time>
              </div>
              <p>{selectedNotice.content}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default NoticePage;
