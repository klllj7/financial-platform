import express from "express";
import cors from "cors";

import aiRoutingRouter from "./domains/ai-routing/aiRouting.routes.js";
import {
  notFoundHandler,
  errorHandler,
} from "./common/middleware/errorHandler.js";

const app = express();

/**
 * React 프론트엔드의 요청을 허용합니다.
 */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

/**
 * JSON 요청 데이터를 읽을 수 있도록 설정합니다.
 */
app.use(express.json({ limit: "1mb" }));

/**
 * 서버 실행 여부 확인용 API입니다.
 */
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      status: "UP",
      service: "financial-platform-backend",
    },
    error: null,
  });
});

/**
 * B 담당 AI 라우팅 API입니다.
 */
app.use("/api", aiRoutingRouter);

/**
 * 존재하지 않는 API와 서버 오류를 처리합니다.
 * 반드시 라우터 등록보다 아래에 작성합니다.
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;