const express = require("express"); // Express 서버 사용
const cors = require("cors");       // Frontend-Backend 통신 설정
const policyInfo = require("./domains/policy/models/policyInfo"); // PolicyInfo 모델 불러오기
const policyRoutes = require("./domains/policy/routes/policyRoutes"); // Policy 관련 라우터 불러오기
const PolicyHistory = require("./domains/policy/models/policyHistory"); // PolicyHistory 모델 불러오기
require("dotenv").config();         // .env 파일 읽기 설정

// PostgreSQL 연결 설정 파일 불러오기
const sequelize = require("./common/config/db");

const app = express();

app.use(cors());
app.use(express.json());
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

const PORT = process.env.PORT || 8080;

// 서버 시작 함수
const startServer = async () => {
  try {
    // PostgreSQL 연결 확인
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // 모델과 DB 테이블 동기화
    console.log("테이블 동기화 완료");
    console.log("PostgreSQL DB 연결 성공");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("서버 시작 실패:", error);
  }
};

startServer();