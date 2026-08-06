import { useNavigate, useSearchParams } from "react-router-dom";
import "./PrivacyPolicyPage.css";

function PrivacyPolicyPage() {
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
        
        {/* 개인정보처리방침 상단 제목 영역 */}
        <header className="privacy-header">
          <p className="privacy-eyebrow">ComplianceAI Privacy Policy</p>
          <h1>개인정보처리방침</h1>
          <p className="privacy-description">
            ComplianceAI는 생성형 AI 사용 승인, 민감정보 탐지 및 비식별 처리,
            사용 이력 관리, 감사 리포트 생성을 지원하는 보안·컴플라이언스
            플랫폼입니다. 본 개인정보처리방침은 서비스 이용 과정에서 처리되는
            개인정보의 항목, 목적, 보유기간 및 보호조치를 안내하기 위해
            수립되었습니다.
          </p>
          <p className="privacy-effective-date">시행일자: 2026년 8월 6일</p>
        </header>

        {/* 주요 개인정보 처리 표시 */}
        <section className="privacy-highlight">
          <h2>주요 개인정보 처리 표시</h2>

          <div className="privacy-highlight-grid">
            <article className="privacy-highlight-card">
              <span>개인정보 수집</span>
              <strong>이름, 이메일, 부서, 권한</strong>
              <p>회원가입, 로그인, 계정 및 권한 관리를 위해 사용합니다.</p>
            </article>

            <article className="privacy-highlight-card">
              <span>AI 사용 로그</span>
              <strong>프롬프트, 응답, 모델, 위험도</strong>
              <p>AI 사용 통제, 감사, 소명 리포트 생성을 위해 기록합니다.</p>
            </article>

            <article className="privacy-highlight-card">
              <span>로그인 이력</span>
              <strong>성공 여부, IP, 접속 환경</strong>
              <p>비정상 접근 탐지 및 계정 보안 관리를 위해 저장합니다.</p>
            </article>

            <article className="privacy-highlight-card">
              <span>민감정보 보호</span>
              <strong>탐지, 마스킹, 차단</strong>
              <p>AI 모델 호출 전 개인정보 노출 위험을 줄입니다.</p>
            </article>
          </div>
        </section>

        {/* 목차 */}
        <nav className="privacy-toc" aria-label="개인정보처리방침 목차">
          <h2>목차</h2>

          <div className="privacy-toc-grid">
            <a href="#article-1">제1조 총칙</a>
            <a href="#article-2">제2조 개인정보의 처리 목적, 수집 항목, 보유기간</a>
            <a href="#article-3">제3조 생성형 AI 사용 과정에서 처리되는 개인정보</a>
            <a href="#article-4">제4조 개인정보의 파기 절차 및 방법</a>
            <a href="#article-5">제5조 개인정보의 제3자 제공</a>
            <a href="#article-6">제6조 개인정보 처리의 위탁</a>
            <a href="#article-7">제7조 정보주체의 권리·의무 및 행사방법</a>
            <a href="#article-8">제8조 개인정보의 안전성 확보조치</a>
            <a href="#article-9">제9조 개인정보 자동 수집 장치의 운영</a>
            <a href="#article-10">제10조 개인정보 보호책임자 및 열람청구</a>
            <a href="#article-11">제11조 권익침해 구제방법</a>
            <a href="#article-12">제12조 개인정보처리방침 변경 및 고지</a>
          </div>
        </nav>

        {/* 제1조 */}
        <section id="article-1" className="privacy-section">
          <h2>제1조 총칙</h2>
          <p>
            ComplianceAI(이하 “회사” 또는 “서비스”)는 정보주체의 자유와 권리
            보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하며,
            개인정보를 적법하고 안전하게 처리·관리하고 있습니다.
          </p>
          <p>
            본 서비스는 기업 내부 임직원의 생성형 AI 사용 신청, 민감정보 탐지
            및 비식별 처리, 관리자 승인, 사용 이력 저장, 감사 및 소명 리포트
            생성을 지원하기 위한 보안·컴플라이언스 플랫폼입니다.
          </p>
          <p>
            회사는 개인정보를 수집 목적 범위 내에서만 처리하며, 수집 목적이
            변경되는 경우 관련 법령에 따라 별도의 동의를 받거나 필요한 조치를
            이행합니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>임직원 사용자</td>
                  <td>생성형 AI 사용을 신청하거나 AI 기능을 이용하는 일반 사용자</td>
                </tr>
                <tr>
                  <td>보안·컴플라이언스 담당자</td>
                  <td>AI 사용 신청 검토, 정책 관리, 위험 이벤트 확인, 감사 리포트 관리 담당자</td>
                </tr>
                <tr>
                  <td>관리자</td>
                  <td>계정, 권한, 부서, 시스템 설정을 관리하는 사용자</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제2조 */}
        <section id="article-2" className="privacy-section">
          <h2>제2조 개인정보의 처리 목적, 수집 항목, 보유 및 이용기간</h2>
          <p>
            회사는 서비스 제공을 위해 필요한 범위에서 최소한의 개인정보를
            수집·이용합니다.
          </p>

          <h3>1. 필수 수집·이용 항목</h3>
          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>처리 목적</th>
                  <th>수집 항목</th>
                  <th>보유 및 이용기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>회원가입 및 계정 생성</td>
                  <td>이름, 이메일, 비밀번호, 부서 정보</td>
                  <td>회원 탈퇴 또는 계정 삭제 시까지</td>
                </tr>
                <tr>
                  <td>로그인 및 인증</td>
                  <td>이메일, 비밀번호, JWT 인증 정보</td>
                  <td>인증 토큰 만료 시까지</td>
                </tr>
                <tr>
                  <td>사용자 권한 관리</td>
                  <td>사용자 ID, 이름, 이메일, 부서, 권한, 계정 상태</td>
                  <td>계정 삭제 시까지</td>
                </tr>
                <tr>
                  <td>로그인 이력 관리</td>
                  <td>사용자 ID, 로그인 성공 여부, 실패 사유, IP 주소, 접속 환경, 로그인 시각</td>
                  <td>서비스 운영 및 감사 목적 달성 시까지</td>
                </tr>
                <tr>
                  <td>회원가입 약관 동의 이력 관리</td>
                  <td>
                    사용자 ID, 동의한 약관 종류 및 버전, 동의 여부, 동의 시각, IP 주소, 접속 환경
                  </td>
                  <td>회원 탈퇴 또는 계정 삭제 시까지</td>
                </tr>
                <tr>
                  <td>AI 사용 신청 관리</td>
                  <td>신청자 정보, 부서, 사용 목적, 신청 내용, 사용하려는 AI 모델 정보, 신청 상태</td>
                  <td>신청 처리 완료 후 감사 보관기간까지</td>
                </tr>
                <tr>
                  <td>AI 사용 이력 관리</td>
                  <td>사용자 ID, 사용 모델, 입력 일시, 처리 상태, 마스킹 여부, 위험도, 사용 결과 요약</td>
                  <td>감사 및 소명 목적 달성 시까지</td>
                </tr>
                <tr>
                  <td>민감정보 탐지 및 마스킹</td>
                  <td>사용자가 입력한 프롬프트, 탐지된 개인정보 유형, 마스킹 처리 결과</td>
                  <td>감사 및 보안 점검 목적 달성 시까지</td>
                </tr>
                <tr>
                  <td>관리자 조치 이력 관리</td>
                  <td>관리자 ID, 조치 대상 사용자, 조치 유형, 변경 전·후 값, 조치 시각</td>
                  <td>감사 및 내부통제 목적 달성 시까지</td>
                </tr>
                <tr>
                  <td>감사 리포트 생성</td>
                  <td>AI 사용 통계, 위험 이벤트, 승인·반려 이력, 로그 요약 정보</td>
                  <td>리포트 보관기간까지</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2. 선택 수집·이용 항목</h3>
          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>처리 목적</th>
                  <th>수집 항목</th>
                  <th>보유 및 이용기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>사용자 문의 대응</td>
                  <td>문의 내용, 답변 내용, 첨부파일</td>
                  <td>문의 처리 완료 후 내부 보관기간까지</td>
                </tr>
                <tr>
                  <td>서비스 개선 및 통계 분석</td>
                  <td>접속 기록, 메뉴 이용 기록, 기능 사용 통계</td>
                  <td>통계 분석 목적 달성 시까지</td>
                </tr>
                <tr>
                  <td>증빙자료 업로드</td>
                  <td>사용자가 업로드한 증빙 문서, 파일명, 업로드 시각, 업로드 사용자 정보</td>
                  <td>증빙자료 관리 목적 달성 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제3조 */}
        <section id="article-3" className="privacy-section">
          <h2>제3조 생성형 AI 사용 과정에서 처리되는 개인정보 및 비식별 처리</h2>
          <p>
            회사는 생성형 AI 사용 과정에서 개인정보 및 민감정보가 외부 AI 모델에
            직접 전달되는 위험을 줄이기 위해 사전 탐지 및 비식별 처리 절차를
            운영합니다.
          </p>

          <h3>1. 생성형 AI 사용 처리 절차</h3>
          <ol className="privacy-process-list">
            <li>사용자가 프롬프트를 입력합니다.</li>
            <li>서비스가 개인정보 및 민감정보 포함 여부를 탐지합니다.</li>
            <li>필요한 경우 개인정보를 마스킹하거나 요청을 차단합니다.</li>
            <li>정책 검토 및 승인 여부를 확인합니다.</li>
            <li>허용된 요청만 AI 모델로 전달합니다.</li>
            <li>AI 응답 결과를 사용자에게 제공합니다.</li>
            <li>사용 이력 및 감사 로그를 저장합니다.</li>
          </ol>

          <h3>2. 탐지 대상 개인정보 유형</h3>
          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>예시</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>일반 개인정보</td>
                  <td>이름, 이메일, 전화번호, 주소, 사번, 부서명</td>
                </tr>
                <tr>
                  <td>고유식별정보</td>
                  <td>주민등록번호, 운전면허번호, 여권번호 등</td>
                </tr>
                <tr>
                  <td>금융정보</td>
                  <td>계좌번호, 카드번호, 거래내역, 대출정보 등</td>
                </tr>
                <tr>
                  <td>업무상 기밀정보</td>
                  <td>고객 상담 내용, 내부 정책 문서, 계약 정보, 심사 자료</td>
                </tr>
                <tr>
                  <td>인증 정보</td>
                  <td>비밀번호, API Key, Access Token, Secret Key 등</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>3. 비식별 및 마스킹 처리</h3>
          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>처리 방식</th>
                  <th>설명</th>
                  <th>예시</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>부분 마스킹</td>
                  <td>개인정보 일부를 별표 등으로 대체합니다.</td>
                  <td>홍길동 → 홍**</td>
                </tr>
                <tr>
                  <td>전체 마스킹</td>
                  <td>개인정보 전체를 대체 문자열로 변경합니다.</td>
                  <td>010-1234-5678 → [전화번호]</td>
                </tr>
                <tr>
                  <td>요청 차단</td>
                  <td>민감도가 높은 정보가 포함된 경우 AI 모델 호출을 차단합니다.</td>
                  <td>주민등록번호, API Key 등</td>
                </tr>
                <tr>
                  <td>관리자 검토</td>
                  <td>정책 위반 가능성이 있는 경우 보안 담당자의 검토 후 처리합니다.</td>
                  <td>고객정보 포함 프롬프트</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            회사는 원칙적으로 개인정보가 포함된 원문을 AI 모델에 직접 전달하지
            않으며, 필요한 경우 비식별 또는 마스킹된 데이터만 전달합니다.
          </p>
        </section>

        {/* 제4조 */}
        <section id="article-4" className="privacy-section">
          <h2>제4조 개인정보의 파기 절차 및 방법</h2>
          <p>
            회사는 개인정보 보유기간의 경과, 처리 목적 달성, 서비스 이용 종료 등
            개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를
            파기합니다.
          </p>

          <h3>1. 파기 절차</h3>
          <p>
            개인정보는 처리 목적 달성 후 내부 방침 및 관련 법령에 따라 일정 기간
            보관된 뒤 파기됩니다. 다른 법령에 따라 보존해야 하는 경우에는 해당
            개인정보를 별도 DB 또는 분리된 저장공간에 보관하고, 법령에서 정한
            기간이 경과한 후 파기합니다.
          </p>

          <h3>2. 파기 방법</h3>
          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>개인정보 형태</th>
                  <th>파기 방법</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>전자적 파일</td>
                  <td>복구 또는 재생할 수 없는 방법으로 삭제</td>
                </tr>
                <tr>
                  <td>데이터베이스 기록</td>
                  <td>논리 삭제 또는 물리 삭제 후 복구 불가 처리</td>
                </tr>
                <tr>
                  <td>종이 문서</td>
                  <td>분쇄 또는 소각</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제5조 */}
        <section id="article-5" className="privacy-section">
          <h2>제5조 개인정보의 제3자 제공</h2>
          <p>
            회사는 정보주체의 개인정보를 제2조에서 명시한 처리 목적 범위
            내에서만 처리하며, 정보주체의 동의가 있거나 법률에 특별한 규정이
            있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>제공 사유</th>
                  <th>설명</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>정보주체의 동의</td>
                  <td>정보주체가 사전에 제3자 제공에 동의한 경우</td>
                </tr>
                <tr>
                  <td>법령상 의무</td>
                  <td>법률에 특별한 규정이 있거나 수사기관, 감독기관 등의 적법한 요청이 있는 경우</td>
                </tr>
                <tr>
                  <td>급박한 보호 필요</td>
                  <td>정보주체 또는 제3자의 생명, 신체, 재산 보호를 위해 필요한 경우</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제6조 */}
        <section id="article-6" className="privacy-section">
          <h2>제6조 개인정보 처리의 위탁</h2>
          <p>
            회사는 원활한 서비스 제공을 위해 개인정보 처리 업무의 일부를 외부
            업체 또는 클라우드 서비스 제공자에게 위탁할 수 있습니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>수탁자</th>
                  <th>위탁 업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AWS</td>
                  <td>클라우드 인프라 운영, 서버 및 데이터 저장, 생성형 AI 모델 호출 환경 제공</td>
                </tr>
                <tr>
                  <td>Neon</td>
                  <td>PostgreSQL 데이터베이스 호스팅 및 관리</td>
                </tr>
                <tr>
                  <td>OpenAI 또는 AWS Bedrock 모델 제공자</td>
                  <td>생성형 AI 응답 생성 처리</td>
                </tr>
                <tr>
                  <td>Vercel 또는 정적 호스팅 서비스</td>
                  <td>프론트엔드 웹 서비스 배포</td>
                </tr>
                <tr>
                  <td>GitHub</td>
                  <td>소스코드 저장소 및 협업 관리</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="privacy-notice">
            ※ 위탁 업체 및 업무 내용은 실제 운영 환경에 따라 변경될 수 있으며,
            변경 시 본 개인정보처리방침 또는 서비스 공지사항을 통해 안내합니다.
          </p>
        </section>

        {/* 제7조 */}
        <section id="article-7" className="privacy-section">
          <h2>제7조 정보주체 및 법정대리인의 권리·의무 및 행사방법</h2>
          <p>
            정보주체는 언제든지 회사에 대해 개인정보 열람, 정정, 삭제,
            처리정지, 동의 철회 등의 권리를 행사할 수 있습니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>권리</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>열람 요구</td>
                  <td>회사가 처리하는 본인의 개인정보 열람 요구</td>
                </tr>
                <tr>
                  <td>정정 요구</td>
                  <td>개인정보가 사실과 다를 경우 정정 요구</td>
                </tr>
                <tr>
                  <td>삭제 요구</td>
                  <td>개인정보 삭제 요구</td>
                </tr>
                <tr>
                  <td>처리정지 요구</td>
                  <td>개인정보 처리의 정지 요구</td>
                </tr>
                <tr>
                  <td>동의 철회</td>
                  <td>동의에 기반한 개인정보 처리에 대한 동의 철회</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            권리 행사는 서면, 전자우편, 서비스 내 문의 기능 등을 통해 할 수
            있으며, 회사는 관련 법령에 따라 지체 없이 조치합니다.
          </p>
          <p>
            단, 법령에 따라 보관이 필요한 경우, 다른 사람의 권리와 이익을
            침해할 우려가 있는 경우, 서비스 보안 및 감사 목적상 일정 기간 로그
            보관이 필요한 경우에는 권리 행사가 제한될 수 있습니다.
          </p>
        </section>

        {/* 제8조 */}
        <section id="article-8" className="privacy-section">
          <h2>제8조 개인정보의 안전성 확보조치</h2>
          <p>
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 보호조치를
            시행합니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>조치 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>관리적 조치</td>
                  <td>내부관리계획 수립, 개인정보 접근 권한 최소화, 관리자 권한 분리, 정기적 보안 교육</td>
                </tr>
                <tr>
                  <td>기술적 조치</td>
                  <td>비밀번호 암호화, JWT 기반 인증, 접근권한 검증, 로그인 이력 저장, API 접근 제어, 민감정보 마스킹, 데이터베이스 접근 제한</td>
                </tr>
                <tr>
                  <td>물리적 조치</td>
                  <td>클라우드 인프라 접근 통제, 관리자 계정 보호, 중요 시스템 접근 제한</td>
                </tr>
                <tr>
                  <td>감사 조치</td>
                  <td>AI 사용 로그 저장, 관리자 조치 이력 저장, 승인·반려 이력 관리, 감사 리포트 생성</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            특히 본 서비스는 생성형 AI 사용 과정에서 개인정보가 외부 모델에
            직접 노출되는 위험을 줄이기 위해 입력값 검사, 마스킹, 사용 로그
            기록, 관리자 승인 절차를 운영합니다.
          </p>
        </section>

        {/* 제9조 */}
        <section id="article-9" className="privacy-section">
          <h2>제9조 개인정보 자동 수집 장치의 설치·운영 및 거부</h2>
          <p>
            회사는 서비스 제공 및 보안 관리를 위해 쿠키 또는 유사한 기술을
            사용할 수 있습니다.
          </p>

          <h3>1. 자동 수집 항목</h3>
          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>이용 목적</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>접속 IP</td>
                  <td>비정상 접근 탐지, 보안 로그 관리</td>
                </tr>
                <tr>
                  <td>브라우저 및 OS 정보</td>
                  <td>접속 환경 확인, 오류 분석</td>
                </tr>
                <tr>
                  <td>접속 일시</td>
                  <td>로그인 이력 및 감사 로그 관리</td>
                </tr>
                <tr>
                  <td>쿠키 또는 로컬 스토리지</td>
                  <td>로그인 상태 유지, 사용자 인증 토큰 관리</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2. 쿠키 설정 거부 방법</h3>
          <ul className="privacy-list">
            <li>Chrome: 설정 &gt; 개인정보 보호 및 보안 &gt; 서드 파티 쿠키</li>
            <li>Edge: 설정 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 및 사이트 데이터 관리</li>
            <li>Safari: 설정 &gt; 개인정보 보호 및 보안 &gt; 쿠키 차단</li>
          </ul>

          <p>
            단, 쿠키 또는 로컬 스토리지 저장을 거부할 경우 로그인 유지, 인증,
            일부 서비스 이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        {/* 제10조 */}
        <section id="article-10" className="privacy-section">
          <h2>제10조 개인정보 보호책임자 및 개인정보 열람청구</h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄하고, 개인정보 관련 문의 및
            피해구제 처리를 위해 개인정보 보호책임자를 지정합니다.
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
                  <td>개인정보 보호책임자</td>
                  <td>보안·컴플라이언스 담당자</td>
                </tr>
                <tr>
                  <td>담당 부서</td>
                  <td>ComplianceAI 운영팀</td>
                </tr>
                <tr>
                  <td>이메일</td>
                  <td>privacy@complianceai.example</td>
                </tr>
                <tr>
                  <td>연락처</td>
                  <td>000-0000-0000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="privacy-notice">
            ※ 실제 서비스 배포 시에는 실제 담당자명, 부서명, 이메일, 연락처로
            수정해야 합니다.
          </p>
        </section>

        {/* 제11조 */}
        <section id="article-11" className="privacy-section">
          <h2>제11조 권익침해 구제방법</h2>
          <p>
            정보주체는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 상담
            또는 분쟁 해결을 신청할 수 있습니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>기관</th>
                  <th>연락처</th>
                  <th>홈페이지</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>개인정보분쟁조정위원회</td>
                  <td>1833-6972</td>
                  <td>kopico.go.kr</td>
                </tr>
                <tr>
                  <td>개인정보침해신고센터</td>
                  <td>국번없이 118</td>
                  <td>privacy.kisa.or.kr</td>
                </tr>
                <tr>
                  <td>대검찰청</td>
                  <td>국번없이 1301</td>
                  <td>spo.go.kr</td>
                </tr>
                <tr>
                  <td>경찰청</td>
                  <td>국번없이 182</td>
                  <td>ecrm.police.go.kr</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 제12조 */}
        <section id="article-12" className="privacy-section">
          <h2>제12조 개인정보처리방침 변경 및 고지</h2>
          <p>
            본 개인정보처리방침은 2026년 7월 30일부터 적용됩니다. 회사는
            개인정보처리방침의 내용 추가, 삭제 또는 수정이 있을 경우 서비스 내
            공지사항 또는 별도 고지 수단을 통해 사전에 안내합니다.
          </p>

          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>버전</th>
                  <th>적용일자</th>
                  <th>주요 변경 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>v1.0</td>
                  <td>2026.07.30</td>
                  <td>개인정보처리방침 최초 수립</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

export default PrivacyPolicyPage;