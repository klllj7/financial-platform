const express = require("express"); // Express 서버 사용
const cors = require("cors");       // Frontend-Backend 통신 설정
require("dotenv").config();         // .env 파일 읽기 설정


const sequelize = require("./common/config/db");  // PostgreSQL 연결 설정 파일 불러오기
const seedBasicData = require("./db/init");
const authRoutes = require("./domains/auth/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 8080;

// 서버 시작 함수
const startServer = async () => {
  try {
    // PostgreSQL 연결 확인
    await sequelize.authenticate();
    console.log("PostgreSQL DB 연결 성공");

    // 모델 기준으로 DB 테이블 생성/수정
    await sequelize.sync({ alter: true });
    console.log("DB 테이블 동기화 완료");

    // 기본 권한/부서 데이터 생성
    await seedBasicData();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("서버 시작 실패:", error);
  }
};

startServer();