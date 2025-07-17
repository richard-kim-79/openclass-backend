#!/bin/bash

# 환경 변수 로드
if [ -f "env.development" ]; then
    export $(cat env.development | xargs)
fi

PORT=${PORT:-3001}

echo "🔍 포트 $PORT 점유 프로세스 확인 중..."

# 포트 점유 프로세스 종료
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

echo "✅ 포트 $PORT 정리 완료"
echo "🚀 서버 시작 중..."

# 서버 시작
npm run dev:server 