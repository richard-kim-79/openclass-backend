# OpenClass 베타 버전 설치 가이드

## 🚀 빠른 시작 (5분 설치)

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/openclass.git
cd openclass
```

### 2. 자동 설치 스크립트 실행
```bash
chmod +x scripts/setup-beta.sh
./scripts/setup-beta.sh
```

### 3. 개발 서버 실행
```bash
npm run dev
```

이제 `http://localhost:3000`에서 OpenClass를 확인할 수 있습니다!

## 📋 베타 버전 특징

### ✅ 구현된 기능
- **사용자 인증**: 회원가입, 로그인, 프로필 관리
- **강의실 관리**: 생성, 수정, 삭제, 멤버 관리
- **실시간 소통**: WebSocket 기반 실시간 채팅
- **실시간 알림**: 실시간 알림 시스템
- **자료 공유**: 파일 업로드, 이미지 최적화, 보안 검증
- **검색 기능**: 풀텍스트 검색, 고급 필터링, 검색 히스토리
- **권한 관리**: RBAC 시스템, 역할 기반 접근 제어
- **API 시스템**: RESTful API 및 API 문서
- **반응형 디자인**: 모든 디바이스 지원

### 🎯 최적화 사항
- **SQLite 데이터베이스**: 파일 기반, 별도 서버 불필요
- **로컬 파일 저장**: AWS S3 대신 로컬 디스크 사용
- **메모리 캐싱**: Redis 대신 Node.js 메모리 캐시
- **이미지 최적화**: Sharp 라이브러리로 이미지 리사이징
- **성능 최적화**: 데이터베이스 인덱스, API 캐싱
- **경량화된 의존성**: 핵심 기능만 포함

## 💰 비용 최적화

### 월 예상 비용 (1000명 사용자 기준)
- **서버**: $5-10/월 (VPS)
- **도메인**: $10-15/년
- **SSL 인증서**: 무료 (Let's Encrypt)
- **총 비용**: $5-10/월

### 리소스 사용량
- **CPU**: 1-2 코어
- **메모리**: 1-2GB RAM
- **저장공간**: 10-50GB (사용자 증가에 따라)
- **대역폭**: 100GB/월

## 🔧 수동 설치

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp env.example .env
# .env 파일 편집
```

### 3. 데이터베이스 초기화
```bash
mkdir -p data uploads logs
npm run migrate
```

### 4. 개발 서버 실행
```bash
npm run dev
```

## 🐳 Docker 설치

### 개발 환경
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 프로덕션 환경
```bash
docker-compose up -d
```

## 📊 성능 모니터링

### 기본 모니터링
```bash
# 로그 확인
tail -f logs/app.log

# 데이터베이스 크기 확인
ls -lh data/openclass.dev.db

# 업로드 파일 크기 확인
du -sh uploads/

# 캐시 상태 확인
curl http://localhost:3001/api/cache/status
```

### 시스템 리소스 확인
```bash
# CPU/메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결
netstat -tulpn | grep :3001
```

## 🔍 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   ```bash
   # 포트 사용 확인
   lsof -i :3001
   
   # 포트 정리 후 재시작
   npm run start:clean
   ```

2. **데이터베이스 문제**
   ```bash
   # 마이그레이션 상태 확인
   npm run migrate:status
   
   # DB 초기화
   npm run db:reset
   ```

3. **파일 업로드 오류**
   ```bash
   # 업로드 디렉토리 권한 설정
   chmod 755 uploads/
   ```

4. **클라이언트 의존성 문제**
   ```bash
   # 클라이언트 의존성 재설치
   cd client && npm install --legacy-peer-deps
   ```

5. **실시간 기능 문제**
   ```bash
   # WebSocket 연결 확인
   # 브라우저 개발자 도구에서 네트워크 탭 확인
   ```

6. **캐시 문제**
   ```bash
   # 캐시 초기화
   curl -X POST http://localhost:3001/api/cache/clear
   ```

## 📈 확장 계획

### 1000명 이상 사용자 시
1. **PostgreSQL 마이그레이션**: SQLite → PostgreSQL
2. **Redis 캐싱**: 메모리 캐시 → Redis
3. **CDN 도입**: 정적 파일 CDN 사용
4. **로드 밸런서**: 다중 서버 구성
5. **AI 검색**: OpenAI + Pinecone 도입

### 10000명 이상 사용자 시
1. **마이크로서비스**: 서비스 분리
2. **컨테이너 오케스트레이션**: Kubernetes
3. **클라우드 네이티브**: AWS/GCP/Azure 활용
4. **모니터링**: Prometheus + Grafana
5. **로깅**: ELK Stack

## 🚀 최신 기능

### 실시간 기능
- **WebSocket 연결**: Socket.IO 기반 실시간 통신
- **실시간 채팅**: 강의실별 실시간 채팅
- **실시간 알림**: 새 메시지, 강의실 업데이트 알림
- **연결 상태**: 실시간 연결 상태 표시

### 고급 기능
- **파일 업로드 개선**: 다양한 파일 타입 지원, 보안 검증
- **검색 기능 강화**: 풀텍스트 검색, 고급 필터링
- **권한 관리**: RBAC 시스템, 세분화된 권한
- **보안 강화**: SQL 인젝션 방지, XSS 방지

### 성능 최적화
- **데이터베이스 최적화**: 인덱스, N+1 쿼리 방지
- **API 캐싱**: 응답 캐싱 시스템
- **이미지 최적화**: 리사이징, WebP 변환
- **정적 파일 캐싱**: 30일 캐시 헤더

## 📞 지원

- **기술 문의**: GitHub Issues
- **문서**: [docs/](./docs/) 디렉토리
- **빠른 시작**: `./scripts/setup-beta.sh`
- **API 문서**: http://localhost:3001/api-docs

---

**OpenClass 베타** - 가볍고 빠른 온라인 학습 플랫폼 🎓 