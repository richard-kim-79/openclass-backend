# OpenClass 개발 가이드

## 🚀 개발 환경 설정

### 필수 요구사항 (베타용)

- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **SQLite**: 3.0.0 이상 (대부분의 시스템에 기본 설치됨)
- **Docker**: 20.0.0 이상 (선택사항)

### 초기 설정

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-org/openclass.git
   cd openclass
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp env.example .env
   # .env 파일을 편집하여 필요한 설정을 추가
   ```

4. **데이터베이스 설정**
   ```bash
   # SQLite 데이터베이스 초기화
   mkdir -p data
   sqlite3 data/openclass.db < migrations/001_initial_schema.sql
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

## 📁 프로젝트 구조

```
openclass/
├── src/
│   ├── server/           # 서버 코드
│   │   ├── index.ts      # 서버 진입점
│   │   ├── app.ts        # Express 앱 설정
│   │   ├── routes/       # API 라우트
│   │   ├── controllers/  # 컨트롤러
│   │   ├── services/     # 비즈니스 로직
│   │   ├── models/       # 데이터 모델
│   │   ├── middleware/   # 미들웨어
│   │   ├── utils/        # 유틸리티 함수
│   │   └── types/        # TypeScript 타입 정의
│   ├── client/           # 클라이언트 코드 (React)
│   └── shared/           # 공유 코드
├── docs/                 # 문서
├── tests/                # 테스트 파일
├── scripts/              # 빌드/배포 스크립트
└── config/               # 설정 파일
```

## 🛠 개발 워크플로우

### 1. 브랜치 전략

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발
- `hotfix/*`: 긴급 수정

### 2. 커밋 메시지 규칙

Conventional Commits 형식을 따릅니다:

```
type(scope): description

feat: 새로운 기능
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 또는 보조 도구 변경
```

### 3. PR 가이드라인

1. **기능 브랜치 생성**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **개발 및 테스트**
   ```bash
   npm run test
   npm run lint
   npm run format
   ```

3. **커밋 및 푸시**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

4. **PR 생성**
   - GitHub에서 Pull Request 생성
   - 리뷰어 지정
   - 관련 이슈 연결

## 🧪 테스트

### 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 테스트 감시 모드
npm run test:watch

# 커버리지 리포트
npm run test:coverage

# 통합 테스트
npm run test:integration

# E2E 테스트
npm run test:e2e
```

### 테스트 작성 가이드

1. **단위 테스트**: 개별 함수/클래스 테스트
2. **통합 테스트**: API 엔드포인트 테스트
3. **E2E 테스트**: 사용자 시나리오 테스트

## 🔧 코드 품질

### 린팅 및 포맷팅

```bash
# ESLint 검사
npm run lint

# ESLint 자동 수정
npm run lint:fix

# Prettier 포맷팅
npm run format
```

### 타입 체크

```bash
# TypeScript 타입 체크
npx tsc --noEmit
```

## 🐳 Docker 개발

### Docker Compose로 전체 스택 실행

```bash
# 개발 환경 실행
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 서비스 중지
docker-compose -f docker-compose.dev.yml down
```

### 개별 서비스 실행

```bash
# PostgreSQL만 실행
docker run -d --name postgres-dev \
  -e POSTGRES_DB=openclass_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=dev_password \
  -p 5432:5432 \
  postgres:15-alpine

# Redis만 실행
docker run -d --name redis-dev \
  -p 6379:6379 \
  redis:7-alpine
```

## 🔍 디버깅

### Node.js 디버깅

```bash
# 디버그 모드로 실행
npm run dev:server -- --inspect

# 브레이크포인트 설정
debugger;
```

### VS Code 디버깅

`.vscode/launch.json` 파일을 생성하여 디버깅 설정:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/server/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

## 📊 모니터링

### 로깅

Winston을 사용한 구조화된 로깅:

```typescript
import { logger } from '@/utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: err.message });
```

### 성능 모니터링

```bash
# 메모리 사용량 확인
npm run dev:server -- --inspect --max-old-space-size=4096

# CPU 프로파일링
node --prof src/server/index.ts
```

## 🔐 보안

### 환경 변수 관리

- 민감한 정보는 `.env` 파일에 저장
- `.env` 파일은 `.gitignore`에 추가
- 프로덕션에서는 환경 변수 사용

### 인증 및 권한

- JWT 토큰 사용
- API 키 인증
- 역할 기반 접근 제어 (RBAC)

## 🚀 배포

### 스테이징 배포

```bash
# 스테이징 환경 빌드
npm run build:staging

# Docker 이미지 빌드
docker build -t openclass:staging .

# 스테이징 서버 배포
docker-compose -f docker-compose.staging.yml up -d
```

### 프로덕션 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 배포
docker-compose up -d
```

## 📚 추가 리소스

- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Express.js 가이드](https://expressjs.com/)
- [Socket.io 문서](https://socket.io/docs/)
- [Jest 테스팅](https://jestjs.io/docs/getting-started)
- [Docker 문서](https://docs.docker.com/)

## 🤝 기여하기

1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성
3. 개발 및 테스트
4. PR 생성 및 리뷰
5. 승인 후 머지

## 📞 지원

- **기술 문의**: [GitHub Issues](https://github.com/your-org/openclass/issues)
- **문서**: [docs/](./) 디렉토리
- **코드 리뷰**: PR에서 리뷰 요청 