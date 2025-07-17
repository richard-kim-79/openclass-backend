#!/bin/bash

# ===========================================
# OpenClass 배포 스크립트
# ===========================================

set -e

echo "🚀 OpenClass 배포를 시작합니다..."

# 환경 변수 확인
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
fi

# 의존성 설치
echo "📦 의존성을 설치합니다..."
npm ci --only=production

# TypeScript 빌드
echo "🔨 TypeScript를 빌드합니다..."
npm run build

# 데이터베이스 마이그레이션
echo "🗄️ 데이터베이스 마이그레이션을 실행합니다..."
npm run migrate

# 환경 변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️ .env 파일이 없습니다. env.example을 복사합니다..."
    cp env.example .env
    echo "⚠️ .env 파일을 수정하여 실제 값으로 설정하세요."
fi

# 로그 디렉토리 생성
echo "📁 로그 디렉토리를 생성합니다..."
mkdir -p logs
mkdir -p uploads
mkdir -p data

# 권한 설정
echo "🔐 파일 권한을 설정합니다..."
chmod 755 logs uploads data

# 애플리케이션 시작
echo "✅ 배포가 완료되었습니다."
echo "🚀 애플리케이션을 시작합니다..."
npm start 