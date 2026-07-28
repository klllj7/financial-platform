import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { findEmail, getDepartments } from "../../api/authApi";
import "./FindIdPage.css";

function FindIdPage() {
  const navigate = useNavigate();

  // 아이디 찾기 입력값 상태
  const [findIdForm, setFindIdForm] = useState({
    name: "",
    department: "",
  });

  // 화면에 보여줄 안내 메시지
  const [resultMessage, setResultMessage] = useState("");

  // API 요청 중인지 확인하는 상태
  const [isLoading, setIsLoading] = useState(false);

  // DB에서 조회한 부서 목록
  const [departments, setDepartments] = useState([]);

  // input, select 값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFindIdForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 아이디 찾기 버튼 클릭
  const handleFindIdSubmit = async (e) => {
    e.preventDefault();

    if (!findIdForm.name || !findIdForm.department) {
      setResultMessage("이름과 부서를 모두 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setResultMessage("");

      /*
        이름과 부서 코드를 백엔드로 보내서
        일치하는 사용자 이메일을 조회한다.
        백엔드는 개인정보 보호를 위해 마스킹된 이메일만 반환한다.
      */
      const result = await findEmail({
        name: findIdForm.name,
        department: findIdForm.department,
      });

      setResultMessage(`가입된 이메일: ${result.data.maskedEmail}`);
    } catch (error) {
      console.error("아이디 찾기 실패:", error);

      setResultMessage(
        error.response?.data?.error?.message ||
          "아이디 찾기에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 부서 목록 조회
  const fetchDepartments = async () => {
    try {
      const result = await getDepartments();
      setDepartments(result.data);
    } catch (error) {
      console.error("부서 목록 조회 실패: ", error);
      setResultMessage("부서 목록을 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <main className="find-id-page">
      <section className="find-id-card">
        <div className="find-id-header">
          <p>Account Recovery</p>
          <h1>아이디 찾기</h1>
          <span>
            가입 시 입력한 이름과 부서를 입력하면 계정 정보를 확인할 수 있습니다.
          </span>
        </div>

        <form className="find-id-form" onSubmit={handleFindIdSubmit}>
          <div className="find-id-form-group">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              name="name"
              value={findIdForm.name}
              onChange={handleInputChange}
              placeholder="이름을 입력해주세요"
            />
          </div>

          <div className="find-id-form-group">
            <label htmlFor="department">부서</label>
            <select
              id="department"
              name="department"
              value={findIdForm.department}
              onChange={handleInputChange}
            >
              <option value="">부서를 선택해주세요</option>
              {departments.map((department) => (
                <option key={department.id} value={department.code}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {resultMessage && (
            <div className="find-id-result-message">
              {resultMessage}
            </div>
          )}

          <button 
            type="submit" 
            className="find-id-submit-button"
            disabled={isLoading}
          >
            {isLoading ? "조회 중..." : "아이디 찾기"}
          </button>
        </form>

        <div className="find-id-footer">
          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </section>
    </main>
  );
}

export default FindIdPage;