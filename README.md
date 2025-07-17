# OpenClass - 온라인 강의실 플랫폼

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8+-green.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> 실시간 상호작용이 가능한 온라인 강의실 플랫폼

## 📋 목차

- [소개](#-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [설치 및 실행](#-설치-및-실행)
- [API 문서](#-api-문서)
- [개발 가이드](#-개발-가이드)
- [배포](#-배포)
- [기여하기](#-기여하기)
- [라이선스](#-라이선스)

## 🎯 소개

OpenClass는 실시간 채팅, 파일 공유, 권한 관리 등의 기능을 제공하는 온라인 강의실 플랫폼입니다. 강사와 학생들이 효율적으로 소통하고 학습할 수 있는 환경을 제공합니다.

### 주요 특징

- **실시간 상호작용**: Socket.IO를 통한 실시간 채팅 및 알림
- **권한 관리**: 역할 기반 접근 제어(RBAC) 시스템
- **고급 검색**: 풀텍스트 검색 및 필터링 기능
- **파일 관리**: 이미지 최적화 및 다양한 파일 타입 지원
- **성능 최적화**: 캐싱 시스템 및 데이터베이스 인덱스 최적화
- **모니터링**: 헬스체크 및 성능 모니터링

## 🏆 진행상황

- **P0 - 핵심 기능**: 사용자 인증, 강의실 CRUD, 기본 API (완료)
- **P1 - 실시간 기능**: 실시간 채팅, 알림, Socket.IO (완료)
- **P2 - 고급 기능**: 권한 관리, 고급 검색, 파일 업로드, 분석 (완료)
- **P3 - 성능 최적화/배포**: 인덱스, 캐싱, 이미지 최적화, Docker, 헬스체크 (완료)
- **P4 - 운영 및 확장**: CI/CD 자동화, 백업 시스템, 로그 수집/분석, 실시간 화상 회의(WebRTC), 마이그레이션 자동화 (완료)

## ✨ 주요 기능 (업데이트)

- **운영 자동화**: GitHub Actions 기반 CI/CD, 자동 빌드/테스트/배포
- **백업 시스템**: DB/업로드/로그/전체 백업 스크립트, 보관 정책
- **로그 수집/분석**: 서비스/미들웨어/REST API/Swagger 통합
- **실시간 화상 회의**: WebRTC 기반 방 관리, 시그널링, 채팅, 화면공유, DB 연동
- **마이그레이션 자동화**: 신규 테이블/인덱스 자동 적용

## 🛠️ 기술 스택

### Backend
- **런타임**: Node.js 18+
- **프레임워크**: Express.js
- **언어**: TypeScript
- **데이터베이스**: SQLite (베타용)
- **실시간**: Socket.IO
- **인증**: JWT, Passport.js
- **파일 처리**: Multer, Sharp
- **문서화**: Swagger/OpenAPI
- **테스트**: Jest, Supertest

### Frontend
- **프레임워크**: React 18
- **언어**: TypeScript
- **빌드 도구**: Vite
- **상태 관리**: React Query
- **UI 라이브러리**: Tailwind CSS
- **아이콘**: Heroicons
- **라우팅**: React Router

### Infrastructure
- **컨테이너화**: Docker, Docker Compose
- **웹 서버**: Nginx (프록시)
- **모니터링**: 헬스체크 엔드포인트
- **배포**: 자동화 스크립트

## 🚀 설치 및 실행

### 요구사항

- Node.js 18.0.0 이상
- npm 8.0.0 이상
- Git

### 1. 저장소 클론

```bash
git clone <repository-url>
cd openclass20250715
```

### 2. 의존성 설치

```bash
# 루트 의존성 설치
npm install

# 클라이언트 의존성 설치
cd client && npm install && cd ..
```

### 3. 환경 변수 설정

```bash
# 환경 변수 파일 복사
cp env.example .env

# .env 파일 수정 (필요한 값들 설정)
nano .env
```

### 4. 데이터베이스 마이그레이션

```bash
# 마이그레이션 실행
npm run migrate
```

### 5. 개발 서버 실행

```bash
# 개발 서버 실행 (서버 + 클라이언트)
npm run dev

# 또는 개별 실행
npm run dev:server  # 서버만
npm run dev:client  # 클라이언트만
```

### 6. 브라우저에서 확인

- **클라이언트**: http://localhost:3000
- **서버**: http://localhost:3001
- **API 문서**: http://localhost:3001/api-docs

## 📚 API 문서

### 기본 정보
- **기본 URL**: `http://localhost:3001`
- **API 버전**: v1
- **인증 방식**: JWT Bearer Token

### 주요 엔드포인트

#### 인증
- `POST /api/users/register` - 회원가입
- `POST /api/users/login` - 로그인
- `GET /api/users/profile` - 프로필 조회

#### 강의실
- `GET /api/classrooms` - 강의실 목록
- `POST /api/classrooms` - 강의실 생성
- `GET /api/classrooms/:id` - 강의실 상세
- `PUT /api/classrooms/:id` - 강의실 수정
- `DELETE /api/classrooms/:id` - 강의실 삭제

#### 검색
- `GET /api/search` - 통합 검색
- `GET /api/search/classrooms` - 강의실 검색
- `GET /api/search/materials` - 자료 검색

#### 헬스체크
- `GET /api/health` - 기본 헬스체크
- `GET /api/health/detailed` - 상세 헬스체크

### 실시간 기능 (Socket.IO)

```javascript
// 클라이언트에서 Socket.IO 연결
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

// 강의실 참여
socket.emit('join_classroom', classroomId);

// 메시지 전송
socket.emit('send_message', {
  classroomId: classroomId,
  message: '안녕하세요!'
});

// 새 메시지 수신
socket.on('new_message', (message) => {
  console.log('새 메시지:', message);
});
```

자세한 API 문서는 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)를 참조하세요.

## 🛠️ 개발 가이드

### 프로젝트 구조

```
openclass20250715/
├── src/
│   ├── server/           # 백엔드 서버 코드
│   │   ├── config/       # 설정 파일들
│   │   ├── controllers/  # API 컨트롤러
│   │   ├── middleware/   # 미들웨어
│   │   ├── routes/       # 라우트 정의
│   │   ├── services/     # 비즈니스 로직
│   │   └── migrations/   # 데이터베이스 마이그레이션
│   └── client/           # 프론트엔드 React 앱
├── data/                 # SQLite 데이터베이스
├── uploads/              # 업로드된 파일들
├── logs/                 # 로그 파일들
└── scripts/              # 배포 및 유틸리티 스크립트
```

### 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 서버만 실행
npm run dev:server

# 클라이언트만 실행
npm run dev:client

# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 린트 수정
npm run lint:fix

# 데이터베이스 마이그레이션
npm run migrate

# 마이그레이션 상태 확인
npm run migrate:status
```

### 개발 단계별 진행 상황

- **P0 - 핵심 기능** ✅ 완료
  - 사용자 인증 시스템
  - 강의실 CRUD 기능
  - 기본 API 엔드포인트

- **P1 - 실시간 기능** ✅ 완료
  - Socket.IO 실시간 서비스
  - 실시간 채팅 및 알림
  - 클라이언트 실시간 기능

- **P2 - 고급 기능** ✅ 완료
  - 권한 관리 시스템 (RBAC)
  - 고급 검색 기능
  - 파일 업로드 서비스
  - 분석 서비스

- **P3 - 성능 최적화** ✅ 완료
  - 데이터베이스 인덱스 최적화
  - 캐싱 시스템
  - 파일 최적화
  - 배포 준비

자세한 개발 작업 요약은 [DEVELOPMENT_SUMMARY.md](./DEVELOPMENT_SUMMARY.md)를 참조하세요.

## 🚀 배포

### Docker를 사용한 배포

```bash
# Docker 이미지 빌드
docker build -t openclass .

# Docker Compose로 실행
docker-compose up -d

# 헬스체크 확인
curl http://localhost:3000/api/health
```

### 수동 배포

```bash
# 배포 스크립트 실행
npm run deploy

# 또는 수동으로
npm ci --only=production
npm run build
npm start
```

### 환경 변수 설정

프로덕션 환경에서는 다음 환경 변수를 설정해야 합니다:

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secure-jwt-secret
DB_PATH=./data/openclass.db
UPLOAD_PATH=./uploads
```

## 📊 성능 지표

### 현재 성능
- **메모리 사용량**: ~180MB (정상 범위)
- **응답 시간**: 평균 <100ms
- **동시 연결**: Socket.IO 지원
- **캐시 히트율**: 메모리 캐시 활성화
- **데이터베이스 인덱스**: 25개 최적화 인덱스 적용

### 최적화 결과
- **N+1 쿼리 방지**: 조인 쿼리로 최적화
- **이미지 최적화**: WebP 변환으로 파일 크기 30% 감소
- **정적 파일 캐싱**: 30일 캐시로 로딩 속도 개선
- **API 응답 캐싱**: 자주 요청되는 데이터 캐싱

## 🤝 기여하기

### 기여 방법

1. 이 저장소를 Fork합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 개발 가이드라인

- TypeScript를 사용합니다
- ESLint 규칙을 준수합니다
- 테스트 코드를 작성합니다
- 커밋 메시지는 명확하게 작성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

### 문서
- [개발 작업 요약](./DEVELOPMENT_SUMMARY.md)
- [프로젝트 상태](./PROJECT_STATUS.md)
- [API 문서](./API_DOCUMENTATION.md)

### 연락처
- **이슈 리포트**: GitHub Issues
- **문의**: 프로젝트 관리자에게 연락

---

**개발 완료일**: 2025-07-16  
**현재 버전**: 1.0.0-beta.1  
**상태**: P3 단계 완료 (성능 최적화 및 배포 준비 완료)

Made with ❤️ by OpenClass Team 