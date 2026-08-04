const express = require("express"); // Express 서버 사용
const cors = require("cors");       // Frontend-Backend 통신 설정
const path = require("path");       // 업로드 폴더 경로 계산용
const policyInfo = require("./domains/policy/models/policyInfo"); // PolicyInfo 모델 불러오기
const regulationRoutes = require("./domains/regulation/routes/regulationRoutes");
const policyRoutes = require("./domains/policy/routes/policyRoutes"); // Policy 관련 라우터 불러오기
const PolicyHistory = require("./domains/policy/models/policyHistory"); // PolicyHistory 모델 불러오기
const RegulationDocument = require("./domains/regulation/models/regulationDocument");
const RegulationClause = require("./domains/regulation/models/regulationClause");
const PolicyClauseMap = require("./domains/regulation/models/policyClauseMap");
require("dotenv").config();         // .env 파일 읽기 설정


const sequelize = require("./common/config/db");  // PostgreSQL 연결 설정 파일 불러오기
const { seedBasicData, seedRegulationData } = require("./db/init");
const authRoutes = require("./domains/auth/auth.routes");
const adminRoutes = require("./domains/admin/admin.routes");
const evidenceRoutes = require("./domains/report/evidence/evidence.routes");
const internalReportRoutes = require("./domains/report/internal-report/internalReport.routes");

/* 새 기능은 기존 도메인 코드를 수정하지 않고 독립 라우터로 연결한다. */
const chatRoutes = require("./domains/chat/chat.routes");
const noticeRoutes = require("./domains/notices/notice.routes");
const aiToolApplicationRoutes = require("./domains/ai-tools/ai-tool-application.routes");
const dashboardRoutes = require("./domains/dashboard/dashboard.routes");

const app = express();

app.use(cors());
app.use(express.json());

// 업로드된 규제 원본 파일을 /uploads/... 경로로 직접 다운로드/조회할 수 있게 정적 서빙
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/regulations", regulationRoutes);
app.use("/api/policies", policyRoutes);

// 서버가 잘 켜졌는지 확인하는 테스트 API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "OK",
      message: "Backend server is running",
    },
    error: null,
  });
});

// Auth API 연결
app.use("/api/auth", authRoutes);

// Admin API 연결
app.use("/api/admin", adminRoutes);

// AI 채팅, 공지사항, AI Tool 신청 현황 API 연결
app.use("/api/chats", chatRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/ai-tool", aiToolApplicationRoutes);
app.use("/api/dashboard", dashboardRoutes);
// report/evidence API 연결
app.use("/api/report/evidence", evidenceRoutes);
// 내부결재용보고서 API 연결
app.use("/api/report/internal-report", internalReportRoutes);

const PORT = process.env.PORT || 8080;

// 서버 시작 함수
const startServer = async () => {
  try {
    // PostgreSQL 연결 확인
    await sequelize.authenticate();
    console.log("PostgreSQL DB 연결 성공");

    // 공유 DB로 전환하면서 sequelize.sync({ alter: true })를 제거함.
    // (서버 켤 때마다 자동으로 스키마를 바꿔서, 공유 DB에서는 팀원 전체에게
    // 영향을 주는 위험한 동작이었음 — 실제로 unique 제약이 중복 생성되는
    // 문제가 있었음). 이제 스키마 변경은 sequelize-cli 마이그레이션으로만 반영한다.

    // 기본 권한/부서 데이터 생성
    await seedBasicData();
    // 규제매핑 샘플 데이터 생성
    await seedRegulationData();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("서버 시작 실패:", error);
  }
};

startServer();
