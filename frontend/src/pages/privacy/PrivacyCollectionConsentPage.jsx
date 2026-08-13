import { useNavigate, useSearchParams } from "react-router-dom";
import "./PrivacyPolicyPage.css";

function PrivacyCollectionConsentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 회원가입 화면의 전문보기에서 열린 페이지인지 확인
  const isOpenedFromSignup = searchParams.get("from") === "signup";

  const handlePageExit = () => {
    if (isOpenedFromSignup) {
      window.close();
      return;
    }

    navigate(-1);
  };

  return (
    <main className="privacy-page">
      <section className="privacy-container">
        {/* 접근 경로에 따라 창 닫기 또는 이전 화면 이동 */}
        <button
          type="button"
          className="privacy-back-button"
          onClick={handlePageExit}
        >
          {isOpenedFromSignup ? "✕ 창 닫기" : "← 이전 화면으로"}
        </button>

        {/* 상단 제목 */}
        <header className="privacy-header">
          <p className="privacy-eyebrow">
            ReguPilot Privacy Collection Consent
          </p>

          <h1>개인정보 수집·이용 동의 안내</h1>

          <p className="privacy-description">
            ReguPilot 회원가입과 계정 관리를 위해 아래와 같이 개인정보를
            수집·이용합니다. 내용을 확인한 후 동의 여부를 선택해주세요.
          </p>

          <p className="privacy-effective-date">
            동의서 버전: 1.0 · 시행일자: 2026년 8월 6일
          </p>
        </header>

        {/* 필수 동의 안내 */}
        <section className="privacy-section">
          <h2>필수 개인정보 수집·이용 내역</h2>

          <p>
            회사는 회원가입, 사용자 인증 및 권한 관리를 위해 필요한 최소한의
            개인정보를 수집·이용합니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>내용</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>수집·이용 목적</td>
                  <td>
                    회원가입 및 계정 생성, 사용자 인증, 부서 및 권한 관리,
                    서비스 이용자 식별
                  </td>
                </tr>

                <tr>
                  <td>필수 입력 항목</td>
                  <td>이름, 이메일, 비밀번호, 부서 정보</td>
                </tr>

                <tr>
                  <td>자동 생성·수집 항목</td>
                  <td>
                    사용자 ID, 동의한 약관 종류 및 버전, 동의 여부, 동의 시각,
                    IP 주소, 접속 환경
                  </td>
                </tr>

                <tr>
                  <td>보유 및 이용기간</td>
                  <td>
                    회원 탈퇴 또는 계정 삭제 시까지
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            비밀번호는 원문 그대로 저장하지 않고 단방향 암호화하여 저장합니다.
          </p>
        </section>

        {/* 약관 동의 이력 안내 */}
        <section className="privacy-section">
          <h2>약관 동의 이력의 처리</h2>

          <p>
            회사는 회원이 동의한 약관의 종류와 버전을 확인하고, 향후 약관 변경
            및 동의 여부를 증명하기 위해 동의 이력을 저장합니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>처리 목적</th>
                  <th>처리 항목</th>
                  <th>보유기간</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>회원가입 동의 사실 확인 및 분쟁 대응</td>
                  <td>
                    사용자 ID, 약관 종류, 약관 버전, 동의 여부, 동의 시각,
                    IP 주소, 접속 환경
                  </td>
                  <td>회원 탈퇴 또는 계정 삭제 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 동의 거부 안내 */}
        <section className="privacy-section">
          <h2>동의 거부 권리 및 불이익</h2>

          <p>
            이용자는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
          </p>

          <p>
            다만, 위 정보는 회원가입과 계정 생성에 필요한 필수 정보이므로
            동의하지 않을 경우 ReguPilot 회원가입 및 서비스 이용이
            제한됩니다.
          </p>
        </section>

        {/* 전체 처리방침 안내 */}
        <section className="privacy-section">
          <h2>개인정보 처리에 관한 추가 안내</h2>

          <p>
            개인정보의 파기 절차, 정보주체의 권리, 개인정보 보호책임자,
            제3자 제공 및 처리 위탁 등에 관한 자세한 사항은 ReguPilot
            개인정보처리방침에서 확인할 수 있습니다.
          </p>
        </section>
      </section>
    </main>
  );
}

export default PrivacyCollectionConsentPage;