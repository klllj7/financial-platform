import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log(`백엔드 서버 실행: http://localhost:${PORT}`);
  console.log(`상태 확인: http://localhost:${PORT}/api/health`);
});