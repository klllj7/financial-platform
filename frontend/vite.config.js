import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 프론트에서 /api로 요청하면 백엔드 localhost:8080으로 전달
// vite dev(server)와 vite preview(preview)는 별도 설정을 보므로 둘 다에 적용한다.
// (preview 쪽을 빠뜨리면 빌드 결과물에서 /dlp-api 요청이 프록시되지 않고
//  SPA fallback으로 index.html이 그대로 응답돼 "res.data.map is not a function" 에러가 난다)
const proxy = {
  "/api": {
    target: "http://localhost:8080",
    changeOrigin: true,
  },
  "/uploads": {
    target: "http://localhost:8080",
    changeOrigin: true,
  },
  // DLP 서버가 /dlp-api 접두사 붙은 경로(/dlp-api/events 등)를 직접 처리하므로
  // (운영 ALB가 경로를 벗기지 않고 그대로 넘기는 것과 동일하게) 여기서도 벗기지 않는다.
  "/dlp-api": {
    target: "http://localhost:8000",
    changeOrigin: true,
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
