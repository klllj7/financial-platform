const NOTICE_READ_EVENT = "notice-read-state-changed";

const getUserKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?.email || user?.loginId || "anonymous";
  } catch {
    return "anonymous";
  }
};

const getStorageKey = () => `read-notice-ids:${getUserKey()}`;

export const getReadNoticeIds = () => {
  try {
    const storedIds = JSON.parse(localStorage.getItem(getStorageKey()) || "[]");
    return new Set(Array.isArray(storedIds) ? storedIds.map(String) : []);
  } catch {
    return new Set();
  }
};

export const hasUnreadNotices = (notices = []) => {
  const readIds = getReadNoticeIds();
  return notices.some((notice) => !readIds.has(String(notice.id)));
};

export const markNoticeAsRead = (noticeId) => {
  if (noticeId == null) return;

  const readIds = getReadNoticeIds();
  readIds.add(String(noticeId));
  localStorage.setItem(getStorageKey(), JSON.stringify([...readIds]));
  window.dispatchEvent(new CustomEvent(NOTICE_READ_EVENT));
};

export const subscribeNoticeReadState = (listener) => {
  window.addEventListener(NOTICE_READ_EVENT, listener);
  return () => window.removeEventListener(NOTICE_READ_EVENT, listener);
};
