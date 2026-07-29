import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import { getMyDashboardUsage } from "../../api/dashboardApi";
import "./UsageHistoryPage.css";

const PAGE_SIZE = 10;

const getCurrentDate = () => {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

const TODAY = getCurrentDate();

const RISK_LABELS = {
  ALL: "전체 등급",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

function UsageHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [riskLevel, setRiskLevel] = useState("ALL");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUsageHistory = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getMyDashboardUsage({
          page,
          size: PAGE_SIZE,
          month: selectedDate.slice(0, 7),
          date: selectedDate,
          riskLevel: riskLevel === "ALL" ? undefined : riskLevel,
        });
        const data = response.data || {};
        setItems(Array.isArray(data.content) ? data.content : []);
        setTotalElements(Number(data.totalElements) || 0);
        setTotalPages(Math.max(Number(data.totalPages) || 1, 1));
      } catch (error) {
        console.error("전체 사용 이력 조회 실패", error);
        setItems([]);
        setTotalElements(0);
        setTotalPages(1);
        setErrorMessage("사용 이력을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageHistory();
  }, [page, riskLevel, selectedDate]);

  const handleDateChange = (event) => {
    if (!event.target.value) return;
    setSelectedDate(event.target.value);
    setPage(0);
  };

  const handleRiskChange = (event) => {
    setRiskLevel(event.target.value);
    setPage(0);
  };

  return (
    <section className="usage-history-page">
      <header className="usage-history-heading">
        <div>
          <h2>AI 사용 이력</h2>
          <p>본인이 사용한 AI 요청과 보안 처리 결과를 확인합니다.</p>
        </div>
        <span>총 {totalElements.toLocaleString("ko-KR")}건</span>
      </header>

      <section className="usage-history-panel">
        <div className="usage-history-toolbar">
          <div className="usage-history-title">
            <History size={18} />
            <h3>전체 사용 이력</h3>
          </div>
          <div className="usage-history-filters">
            <label>
              <span>조회 날짜</span>
              <input
                type="date"
                value={selectedDate}
                max={TODAY}
                onChange={handleDateChange}
              />
            </label>
            <label>
              <span>위험 등급</span>
              <select value={riskLevel} onChange={handleRiskChange}>
                {Object.entries(RISK_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="usage-history-table-wrapper">
          <table className="usage-history-table">
            <thead>
              <tr>
                <th>발생 시각</th>
                <th>AI 모델</th>
                <th>탐지 유형</th>
                <th>위험 등급</th>
                <th>조치 상태</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading &&
                !errorMessage &&
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.occurredAt).toLocaleString("ko-KR")}</td>
                    <td><strong>{item.toolName}</strong></td>
                    <td>{item.detectionType}</td>
                    <td>
                      <span className={`usage-risk-badge ${item.riskLevel.toLowerCase()}`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td>{item.actionStatus}</td>
                  </tr>
                ))}
            </tbody>
          </table>

          {isLoading && (
            <div className="usage-history-empty">사용 이력을 불러오고 있습니다.</div>
          )}
          {!isLoading && errorMessage && (
            <div className="usage-history-empty error">{errorMessage}</div>
          )}
          {!isLoading && !errorMessage && items.length === 0 && (
            <div className="usage-history-empty">
              선택한 조건에 해당하는 사용 이력이 없습니다.
            </div>
          )}
        </div>

        <footer className="usage-history-pagination">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft size={16} />
            이전
          </button>
          <span>{page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            다음
            <ChevronRight size={16} />
          </button>
        </footer>
      </section>
    </section>
  );
}

export default UsageHistoryPage;
