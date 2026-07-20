const express = require("express"); // Express 서버 사용
const cors = require("cors");       // Frontend-Backend 통신 설정
require("dotenv").config();         // .env 파일 읽기 설정

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

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});