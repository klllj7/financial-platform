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
  "/dlp-api": {
    target: "http://localhost:8000",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/dlp-api/, "")
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
