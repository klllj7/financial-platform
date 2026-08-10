# syntax=docker/dockerfile:1

# ---- deps stage: install production dependencies only ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- runtime stage ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# uploadMiddleware.js가 로컬에 저장하는 규제 원본 파일용 디렉터리
RUN mkdir -p uploads/regulations

EXPOSE 8080

# package.json의 start 스크립트("node src/app.js")와 동일한 실제 진입점
CMD ["node", "src/app.js"]
