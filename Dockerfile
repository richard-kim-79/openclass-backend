# ===========================================
# OpenClass Dockerfile
# ===========================================

# 베이스 이미지
FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY tsconfig*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build:server

# 프로덕션 이미지
FROM node:18-alpine AS production

# 보안을 위한 non-root 사용자 생성
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일 복사
COPY --from=base /app/dist ./dist
COPY --from=base /app/src/shared ./src/shared

# 사용자 권한 변경
RUN chown -R nodejs:nodejs /app
USER nodejs

# 포트 노출
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/server/healthcheck.js

# 애플리케이션 실행
CMD ["node", "dist/server/index.js"] 