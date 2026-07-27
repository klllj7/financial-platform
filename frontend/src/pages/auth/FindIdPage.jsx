import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // input, select 값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFindIdForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 아이디 찾기 버튼 클릭
  const handleFindIdSubmit = (e) => {
    e.preventDefault();

    if (!findIdForm.name || !findIdForm.department) {
      setResultMessage("이름과 부서를 모두 입력해주세요.");
      return;
    }

    /*
      지금은 화면 구현 단계라 실제 DB 조회는 하지 않는다.
      나중에 POST /api/auth/find-email API를 붙이면
      여기에서 백엔드로 name, department를 보내고 결과를 받아오면 된다.
    */
    setResultMessage(
      "입력하신 정보와 일치하는 계정이 있는 경우, 가입된 이메일 정보가 표시됩니다."
    );
  };

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
              <option value="LOAN_REVIEW">여신심사팀</option>
              <option value="MARKETING">마케팅팀</option>
              <option value="IT_SECURITY">IT보안팀</option>
              <option value="COMPLIANCE">준법감시팀</option>
              <option value="CUSTOMER_SERVICE">고객지원팀</option>
            </select>
          </div>

          {resultMessage && (
            <div className="find-id-result-message">
              {resultMessage}
            </div>
          )}

          <button type="submit" className="find-id-submit-button">
            아이디 찾기
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