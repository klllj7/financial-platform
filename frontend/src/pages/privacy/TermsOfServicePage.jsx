import { useNavigate, useSearchParams } from "react-router-dom";
import "./TermsOfServicePage.css";

function TermsOfServicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 회원가입 화면의 전문보기에서 열림 페이지인지 확인
  const isOpenedFromSignup = searchParams.get("from") === "signup";

  const handlePageExit = () => {
    if (isOpenedFromSignup) {
      window.close();
      return;
    }

    navigate(-1);
  };

  return (
    <main className="terms-page">
      <section className="terms-container">
        {/* 접근 경로에 따라 창 닫기 또는 이전 화면 이동 */}
        <button
          type="button"
          className="terms-back-button"
          onClick={handlePageExit}
        >
          {isOpenedFromSignup ? "✕ 창 닫기" : "← 이전 화면으로"}
        </button>

        {/* 상단 제목 영역 */}
        <header className="terms-header">
          <p className="terms-eyebrow">ComplianceAI Terms of Service</p>
          <h1>서비스 이용약관</h1>
          <p className="terms-description">
            본 약관은 ComplianceAI가 제공하는 생성형 AI 사용 승인, 민감정보
            탐지·비식별 처리, 사용 이력 관리, 감사 리포트 생성 서비스의 이용과
            관련하여 회사와 회원의 권리, 의무, 책임사항 및 서비스 이용조건을
            규정합니다.
          </p>
          <p className="terms-effective-date">시행일자: 2026년 7월 30일</p>
        </header>

        {/* 주요 약관 요약 */}
        <section className="terms-highlight">
          <h2>주요 이용약관 안내</h2>

          <div className="terms-highlight-grid">
            <article className="terms-highlight-card">
              <span>서비스 목적</span>
              <strong>생성형 AI 사용 통제</strong>
              <p>
                임직원의 AI 사용 신청, 승인, 비식별 처리, 감사 로그 관리를
                지원합니다.
              </p>
            </article>

            <article className="terms-highlight-card">
              <span>회원 의무</span>
              <strong>적법하고 안전한 이용</strong>
              <p>
                회원은 개인정보, 기밀정보, 불법 콘텐츠를 부적절하게 입력하거나
                전송해서는 안 됩니다.
              </p>
            </article>

            <article className="terms-highlight-card">
              <span>AI 결과</span>
              <strong>검토 후 활용</strong>
              <p>
                AI 응답은 참고자료이며, 업무상 최종 판단과 책임은 이용자 또는
                승인권자에게 있습니다.
              </p>
            </article>

            <article className="terms-highlight-card">
              <span>이용 제한</span>
              <strong>위반 시 제한 가능</strong>
              <p>
                보안정책 위반, 부정접속, 권한 오남용 시 서비스 이용이 제한될 수
                있습니다.
              </p>
            </article>
          </div>
        </section>

        {/* 목차 */}
        <nav className="terms-toc" aria-label="서비스 이용약관 목차">
          <h2>목차</h2>

          <div className="terms-toc-grid">
            <a href="#terms-1">제1조 목적</a>
            <a href="#terms-2">제2조 약관의 효력 및 변경</a>
            <a href="#terms-3">제3조 용어의 정의</a>
            <a href="#terms-4">제4조 이용계약의 성립</a>
            <a href="#terms-5">제5조 서비스의 제공</a>
            <a href="#terms-6">제6조 회원정보 및 계정 관리</a>
            <a href="#terms-7">제7조 생성형 AI 사용 조건</a>
            <a href="#terms-8">제8조 금지행위</a>
            <a href="#terms-9">제9조 서비스 이용 제한</a>
            <a href="#terms-10">제10조 서비스의 변경 및 중단</a>
            <a href="#terms-11">제11조 지식재산권</a>
            <a href="#terms-12">제12조 개인정보 보호</a>
            <a href="#terms-13">제13조 책임 제한 및 면책</a>
            <a href="#terms-14">제14조 분쟁 해결 및 관할</a>
            <a href="#terms-15">부칙</a>
          </div>
        </nav>

        {/* 제1조 */}
        <section id="terms-1" className="terms-section">
          <h2>제1조 목적</h2>
          <p>
            본 약관은 ComplianceAI(이하 “회사”)가 제공하는 생성형 AI 사용
            승인·비식별·감사대장 자동화 플랫폼 및 관련 서비스(이하 “서비스”)의
            이용과 관련하여 회사와 회원 사이의 권리, 의무, 책임사항, 서비스
            이용조건 및 절차를 규정함을 목적으로 합니다.
          </p>
        </section>

        {/* 제2조 */}
        <section id="terms-2" className="terms-section">
          <h2>제2조 약관의 효력 및 변경</h2>
          <ol className="terms-number-list">
            <li>
              본 약관은 서비스를 이용하고자 하는 회원이 약관 내용에 동의하고
              서비스에 가입하거나 서비스를 이용함으로써 효력이 발생합니다.
            </li>
            <li>
              회사는 본 약관의 내용을 회원이 쉽게 확인할 수 있도록 서비스 화면
              또는 별도 연결화면에 게시합니다.
            </li>
            <li>
              회사는 관련 법령을 위반하지 않는 범위에서 본 약관을 개정할 수
              있습니다.
            </li>
            <li>
              회사가 약관을 개정하는 경우 적용일자 및 개정사유를 명시하여
              서비스 화면 또는 공지사항을 통해 사전에 안내합니다.
            </li>
            <li>
              회원이 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고
              이용계약을 해지할 수 있습니다.
            </li>
          </ol>
        </section>

        {/* 제3조 */}
        <section id="terms-3" className="terms-section">
          <h2>제3조 용어의 정의</h2>

          <div className="terms-table-wrapper">
            <table className="terms-table">
              <thead>
                <tr>
                  <th>용어</th>
                  <th>정의</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>회원</td>
                  <td>
                    본 약관과 개인정보처리방침에 동의하고 회사가 제공하는
                    서비스를 이용하는 자를 말합니다.
                  </td>
                </tr>
                <tr>
                  <td>임직원 사용자</td>
                  <td>
                    기업 내부에서 생성형 AI 사용을 신청하거나 AI 기능을 이용하는
                    일반 사용자를 말합니다.
                  </td>
                </tr>
                <tr>
                  <td>보안·컴플라이언스 담당자</td>
                  <td>
                    AI 사용 신청, 위험 이벤트, 정책 위반 여부, 감사 리포트를
                    검토·관리하는 사용자를 말합니다.
                  </td>
                </tr>
                <tr>
                  <td>관리자</td>
                  <td>
                    계정, 권한, 부서, 시스템 설정 및 서비스 운영을 관리하는
                    사용자를 말합니다.
                  </td>
                </tr>
                <tr>
                  <td>AI 사용 신청</td>
                  <td>
                    회원이 업무상 생성형 AI를 사용하기 위해 목적, 모델, 입력
                    내용 등을 제출하는 행위를 말합니다.
                  </td>
                </tr>
                <tr>
                  <td>민감정보 탐지</td>
                  <td>
                    프롬프트 또는 첨부자료에 개인정보, 금융정보, 인증정보, 내부
                    기밀 등이 포함되어 있는지 확인하는 절차를 말합니다.
                  </td>
                </tr>
                <tr>
                  <td>비식별 처리</td>
                  <td>
                    개인정보 또는 민감정보를 마스킹, 대체, 삭제하여 특정 개인을
                    식별하기 어렵게 처리하는 것을 말합니다.
                  </td>
                </tr>
                <tr>
                  <td>감사 로그</td>
                  <td>
                    서비스 이용 과정에서 발생한 로그인, AI 사용, 승인·반려,
                    관리자 조치 등의 기록을 말합니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제4조 */}
        <section id="terms-4" className="terms-section">
          <h2>제4조 이용계약의 성립</h2>
          <ol className="terms-number-list">
            <li>
              이용계약은 회원이 본 약관 및 개인정보처리방침에 동의하고
              회원가입을 신청한 뒤 회사가 이를 승낙함으로써 성립합니다.
            </li>
            <li>
              회원은 가입 시 이름, 이메일, 비밀번호, 부서 등 회사가 요구하는
              정보를 정확하게 입력하여야 합니다.
            </li>
            <li>
              회사는 기술상 문제, 허위 정보 입력, 권한 오남용 우려, 서비스
              목적에 맞지 않는 신청 등의 사유가 있는 경우 이용신청을 거절하거나
              승낙을 유보할 수 있습니다.
            </li>
            <li>
              회사는 회원 유형에 따라 접근 가능한 메뉴, 기능, 데이터 범위를
              다르게 설정할 수 있습니다.
            </li>
          </ol>
        </section>

        {/* 제5조 */}
        <section id="terms-5" className="terms-section">
          <h2>제5조 서비스의 제공</h2>
          <p>회사는 회원에게 다음 각 호의 서비스를 제공할 수 있습니다.</p>

          <div className="terms-table-wrapper">
            <table className="terms-table">
              <thead>
                <tr>
                  <th>서비스</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>계정 및 권한 관리</td>
                  <td>회원가입, 로그인, 부서·권한 관리, 계정 활성/비활성 관리</td>
                </tr>
                <tr>
                  <td>AI 사용 신청 관리</td>
                  <td>생성형 AI 사용 목적, 모델, 입력 내용에 대한 신청 및 검토</td>
                </tr>
                <tr>
                  <td>민감정보 탐지 및 비식별 처리</td>
                  <td>AI 입력값 내 개인정보, 금융정보, 기밀정보 탐지 및 마스킹</td>
                </tr>
                <tr>
                  <td>AI 사용 기능</td>
                  <td>승인된 범위 내에서 생성형 AI 모델 호출 및 응답 제공</td>
                </tr>
                <tr>
                  <td>감사 로그 관리</td>
                  <td>로그인 이력, AI 사용 이력, 승인·반려 이력, 관리자 조치 이력 저장</td>
                </tr>
                <tr>
                  <td>감사 리포트 생성</td>
                  <td>AI 사용 현황, 위험 이벤트, 정책 위반 의심 내역에 대한 리포트 생성</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제6조 */}
        <section id="terms-6" className="terms-section">
          <h2>제6조 회원정보 및 계정 관리</h2>
          <ol className="terms-number-list">
            <li>
              회원은 가입 및 서비스 이용 과정에서 정확한 정보를 제공하여야 하며,
              정보가 변경된 경우 지체 없이 수정하거나 관리자에게 알려야 합니다.
            </li>
            <li>
              회원은 자신의 이메일, 비밀번호, 인증 정보가 제3자에게 노출되지
              않도록 관리하여야 합니다.
            </li>
            <li>
              회원의 계정으로 발생한 서비스 이용 행위는 원칙적으로 해당 회원의
              행위로 간주됩니다.
            </li>
            <li>
              회사는 계정 도용, 권한 오남용, 비정상 접근이 의심되는 경우 계정
              이용을 제한하거나 관리자 검토를 요청할 수 있습니다.
            </li>
          </ol>
        </section>

        {/* 제7조 */}
        <section id="terms-7" className="terms-section">
          <h2>제7조 생성형 AI 사용 조건</h2>
          <ol className="terms-number-list">
            <li>
              회원은 업무 목적 범위 내에서만 생성형 AI 기능을 이용하여야 합니다.
            </li>
            <li>
              회원은 개인정보, 금융정보, 인증정보, 영업비밀, 내부 기밀 등
              민감한 정보를 회사의 승인 없이 AI 입력값으로 사용해서는 안 됩니다.
            </li>
            <li>
              회사는 AI 모델 호출 전 입력값에 대해 민감정보 탐지, 마스킹, 차단,
              관리자 검토 절차를 수행할 수 있습니다.
            </li>
            <li>
              생성형 AI가 제공하는 응답은 참고자료이며, 업무상 최종 판단과
              책임은 해당 응답을 활용하는 회원 또는 승인권자에게 있습니다.
            </li>
            <li>
              회사는 감사 및 보안 목적을 위해 AI 사용 요청, 응답, 사용 모델,
              처리 상태, 위험도, 마스킹 여부 등을 기록할 수 있습니다.
            </li>
          </ol>
        </section>

        {/* 제8조 */}
        <section id="terms-8" className="terms-section">
          <h2>제8조 금지행위</h2>
          <p>회원은 다음 각 호의 행위를 하여서는 안 됩니다.</p>

          <ul className="terms-bullet-list">
            <li>타인의 계정, 권한, 인증 정보를 도용하거나 무단으로 사용하는 행위</li>
            <li>허위 정보로 회원가입하거나 서비스 이용 신청을 하는 행위</li>
            <li>개인정보, 고유식별정보, 금융정보, API Key 등을 무단 입력·전송하는 행위</li>
            <li>회사의 승인 없이 기밀문서, 고객정보, 내부 정책자료를 외부 AI 모델에 전달하는 행위</li>
            <li>서비스의 보안 기능, 접근권한, 감사 로그 저장 기능을 우회하거나 방해하는 행위</li>
            <li>악성코드, 자동화 스크립트, 비정상 요청 등을 통해 서비스 운영을 방해하는 행위</li>
            <li>법령 또는 회사의 보안정책, 운영정책에 위반되는 행위</li>
            <li>생성형 AI 결과를 불법적, 차별적, 명예훼손적, 사기적 목적으로 사용하는 행위</li>
          </ul>
        </section>

        {/* 제9조 */}
        <section id="terms-9" className="terms-section">
          <h2>제9조 서비스 이용 제한</h2>
          <ol className="terms-number-list">
            <li>
              회사는 회원이 본 약관을 위반하거나 서비스의 정상 운영을 방해한
              경우 경고, 일시정지, 계정 비활성화, 이용계약 해지 등의 조치를 할 수
              있습니다.
            </li>
            <li>
              회사는 보안상 긴급한 필요가 있는 경우 사전 통지 없이 우선 조치를
              취한 뒤 사후 통지할 수 있습니다.
            </li>
            <li>
              회원은 이용 제한 조치에 이의가 있는 경우 회사가 정한 절차에 따라
              이의신청을 할 수 있습니다.
            </li>
          </ol>
        </section>

        {/* 제10조 */}
        <section id="terms-10" className="terms-section">
          <h2>제10조 서비스의 변경 및 중단</h2>
          <ol className="terms-number-list">
            <li>
              회사는 서비스 개선, 보안 강화, 정책 변경, 기술 환경 변화 등을
              이유로 서비스의 전부 또는 일부를 변경할 수 있습니다.
            </li>
            <li>
              회사는 시스템 점검, 장애, 통신 두절, 클라우드 서비스 장애,
              천재지변 등 불가피한 사유가 있는 경우 서비스 제공을 일시적으로
              중단할 수 있습니다.
            </li>
            <li>
              회사는 서비스 중단이 예정된 경우 사전에 공지하는 것을 원칙으로
              하며, 긴급한 경우 사후에 공지할 수 있습니다.
            </li>
          </ol>
        </section>

        {/* 제11조 */}
        <section id="terms-11" className="terms-section">
          <h2>제11조 지식재산권</h2>
          <ol className="terms-number-list">
            <li>
              회사가 제공하는 서비스, 화면, 소프트웨어, 디자인, 문서, 로고 등에
              대한 지식재산권은 회사 또는 정당한 권리자에게 귀속됩니다.
            </li>
            <li>
              회원이 서비스에 입력하거나 업로드한 자료에 대한 권리와 책임은
              회원 또는 해당 자료의 정당한 권리자에게 있습니다.
            </li>
            <li>
              회원은 타인의 저작권, 영업비밀, 개인정보, 지식재산권을 침해하는
              자료를 서비스에 입력하거나 업로드해서는 안 됩니다.
            </li>
            <li>
              회원이 제3자의 권리를 침해하여 분쟁이 발생한 경우, 회원은 자신의
              책임과 비용으로 이를 해결하여야 합니다.
            </li>
          </ol>
        </section>

        {/* 제12조 */}
        <section id="terms-12" className="terms-section">
          <h2>제12조 개인정보 보호</h2>
          <ol className="terms-number-list">
            <li>
              회사는 관련 법령에 따라 회원의 개인정보를 보호하기 위해
              노력합니다.
            </li>
            <li>
              개인정보의 수집, 이용, 보관, 파기, 제3자 제공, 위탁 등에 관한
              사항은 회사의 개인정보처리방침에 따릅니다.
            </li>
            <li>
              회사는 생성형 AI 사용 과정에서 개인정보가 외부 모델에 불필요하게
              전달되지 않도록 탐지, 마스킹, 차단, 로그 기록 등의 보호조치를
              수행할 수 있습니다.
            </li>
          </ol>
        </section>

        {/* 제13조 */}
        <section id="terms-13" className="terms-section">
          <h2>제13조 책임 제한 및 면책</h2>
          <ol className="terms-number-list">
            <li>
              회사는 천재지변, 장애, 클라우드 서비스 장애, 통신망 장애 등 회사의
              합리적 통제 범위를 벗어난 사유로 서비스를 제공할 수 없는 경우
              책임을 부담하지 않습니다.
            </li>
            <li>
              회사는 회원의 귀책사유로 발생한 서비스 이용 장애, 정보 유출,
              데이터 손실, 권한 오남용에 대해 책임을 부담하지 않습니다.
            </li>
            <li>
              생성형 AI 응답은 모델의 특성상 부정확하거나 불완전할 수 있으며,
              회원은 AI 응답을 업무에 활용하기 전에 적절히 검토하여야 합니다.
            </li>
            <li>
              회사는 무료로 제공되는 서비스 이용과 관련하여 관련 법령에서
              정하는 경우를 제외하고 별도의 손해배상 책임을 부담하지 않습니다.
            </li>
          </ol>
        </section>

        {/* 제14조 */}
        <section id="terms-14" className="terms-section">
          <h2>제14조 분쟁 해결 및 관할</h2>
          <ol className="terms-number-list">
            <li>
              회사와 회원은 서비스 이용과 관련하여 분쟁이 발생한 경우 상호
              성실히 협의하여 해결하도록 노력합니다.
            </li>
            <li>
              협의에도 불구하고 분쟁이 해결되지 않는 경우 관련 법령에 따른
              관할 법원에 소를 제기할 수 있습니다.
            </li>
            <li>본 약관의 해석 및 적용은 대한민국 법령에 따릅니다.</li>
          </ol>
        </section>

        {/* 부칙 */}
        <section id="terms-15" className="terms-section">
          <h2>부칙</h2>

          <div className="terms-table-wrapper">
            <table className="terms-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>시행일</td>
                  <td>본 약관은 2026년 7월 30일부터 시행합니다.</td>
                </tr>
                <tr>
                  <td>버전</td>
                  <td>v1.0</td>
                </tr>
                <tr>
                  <td>주요 내용</td>
                  <td>ComplianceAI 서비스 이용약관 최초 수립</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

export default TermsOfServicePage;