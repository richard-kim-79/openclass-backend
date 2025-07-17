#!/bin/bash

# ===========================================
# OpenClass 베타 환경 설정 스크립트
# ===========================================

echo "🚀 OpenClass 베타 환경 설정을 시작합니다..."

# 1. 의존성 설치
echo "📦 의존성을 설치합니다..."
npm install

# 2. 환경 변수 설정
echo "⚙️ 환경 변수를 설정합니다..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ .env 파일이 생성되었습니다. 필요에 따라 편집해주세요."
else
    echo "ℹ️ .env 파일이 이미 존재합니다."
fi

# 3. 데이터 디렉토리 생성
echo "🗄️ 데이터 디렉토리를 생성합니다..."
mkdir -p data
mkdir -p uploads
mkdir -p logs

# 4. SQLite 데이터베이스 초기화
echo "💾 SQLite 데이터베이스를 초기화합니다..."
if command -v sqlite3 &> /dev/null; then
    sqlite3 data/openclass.db < migrations/001_initial_schema.sql
    echo "✅ 데이터베이스가 초기화되었습니다."
else
    echo "⚠️ sqlite3가 설치되지 않았습니다. 수동으로 설치해주세요:"
    echo "   Ubuntu/Debian: sudo apt install sqlite3"
    echo "   macOS: brew install sqlite3"
    echo "   Windows: https://www.sqlite.org/download.html"
fi

# 5. 개발 서버 실행 준비
echo "🎯 개발 서버 실행 준비가 완료되었습니다!"
echo ""
echo "다음 명령어로 개발 서버를 실행할 수 있습니다:"
echo "  npm run dev"
echo ""
echo "또는 Docker를 사용하여 실행:"
echo "  docker-compose -f docker-compose.dev.yml up -d"
echo ""
echo "📝 참고사항:"
echo "- 베타 버전은 SQLite를 사용하여 가볍게 구성되었습니다"
echo "- 파일 업로드는 로컬 디스크에 저장됩니다"
echo "- 검색은 SQLite FTS5를 사용합니다"
echo "- 1000명 이하 사용자를 위한 최적화된 설정입니다" 