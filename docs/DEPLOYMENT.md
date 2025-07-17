# OpenClass 배포 가이드

## 🚀 배포 개요

OpenClass는 Docker 기반의 컨테이너화된 애플리케이션으로, 다양한 환경에서 배포할 수 있습니다.

## 📋 배포 전 체크리스트

### 필수 요구사항 (베타용)

- [ ] Node.js 18+ 설치
- [ ] Docker 20+ 설치 (선택사항)
- [ ] Docker Compose 설치 (선택사항)
- [ ] SQLite 3 설치 (대부분의 시스템에 기본 설치됨)
- [ ] 도메인 및 SSL 인증서 준비 (선택사항)
- [ ] 환경 변수 설정 완료

### 보안 체크리스트 (베타용)

- [ ] JWT_SECRET 설정 (강력한 랜덤 문자열)
- [ ] API 키 설정
- [ ] OAuth 클라이언트 ID/Secret 설정 (선택사항)
- [ ] 파일 업로드 디렉토리 권한 설정

## 🐳 Docker 배포

### 1. 프로덕션 배포

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/openclass.git
cd openclass

# 2. 환경 변수 설정
cp env.example .env
# .env 파일 편집

# 3. Docker Compose로 배포
docker-compose up -d

# 4. 로그 확인
docker-compose logs -f
```

### 2. 스테이징 배포

```bash
# 스테이징 환경 변수 설정
cp env.example .env.staging

# 스테이징 Docker Compose 실행
docker-compose -f docker-compose.staging.yml up -d
```

### 3. 개발 환경 배포

```bash
# 개발 환경 실행
docker-compose -f docker-compose.dev.yml up -d

# 핫 리로드 활성화
docker-compose -f docker-compose.dev.yml up -d --build
```

## ☁️ 클라우드 배포

### AWS 배포

#### 1. EC2 배포

```bash
# EC2 인스턴스에 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# Docker 설치
sudo apt update
sudo apt install docker.io docker-compose

# 프로젝트 클론
git clone https://github.com/your-org/openclass.git
cd openclass

# 환경 변수 설정
cp env.example .env
# .env 파일 편집

# 배포
sudo docker-compose up -d
```

#### 2. ECS 배포

```yaml
# task-definition.json
{
  "family": "openclass",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "openclass-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/openclass:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/openclass",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3. RDS 데이터베이스 설정

```bash
# RDS 인스턴스 생성
aws rds create-db-instance \
  --db-instance-identifier openclass-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password your-password \
  --allocated-storage 20
```

### Google Cloud Platform 배포

#### 1. Cloud Run 배포

```bash
# 프로젝트 설정
gcloud config set project your-project-id

# Docker 이미지 빌드
docker build -t gcr.io/your-project-id/openclass .

# 이미지 푸시
docker push gcr.io/your-project-id/openclass

# Cloud Run 배포
gcloud run deploy openclass \
  --image gcr.io/your-project-id/openclass \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### 2. Cloud SQL 설정

```bash
# Cloud SQL 인스턴스 생성
gcloud sql instances create openclass-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

# 데이터베이스 생성
gcloud sql databases create openclass \
  --instance=openclass-db
```

### Azure 배포

#### 1. Azure Container Instances

```bash
# Azure CLI 로그인
az login

# 리소스 그룹 생성
az group create --name openclass-rg --location eastus

# 컨테이너 인스턴스 배포
az container create \
  --resource-group openclass-rg \
  --name openclass \
  --image your-registry.azurecr.io/openclass:latest \
  --dns-name-label openclass \
  --ports 3000 \
  --environment-variables NODE_ENV=production
```

## 🔧 수동 배포

### 1. 서버 준비

```bash
# Ubuntu/Debian 서버 설정
sudo apt update
sudo apt install nodejs npm postgresql redis-server nginx

# Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 애플리케이션 배포

```bash
# 프로젝트 클론
git clone https://github.com/your-org/openclass.git
cd openclass

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일 편집

# 빌드
npm run build

# PM2로 프로세스 관리
npm install -g pm2
pm2 start dist/server/index.js --name openclass
pm2 startup
pm2 save
```

### 3. Nginx 설정

```nginx
# /etc/nginx/sites-available/openclass
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com

# 자동 갱신 설정
sudo crontab -e
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 모니터링 설정

### 1. 로그 관리

```bash
# 로그 디렉토리 생성
sudo mkdir -p /var/log/openclass
sudo chown -R $USER:$USER /var/log/openclass

# 로그 로테이션 설정
sudo tee /etc/logrotate.d/openclass << EOF
/var/log/openclass/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF
```

### 2. 시스템 모니터링

```bash
# htop 설치
sudo apt install htop

# 시스템 리소스 모니터링
htop
free -h
df -h
```

### 3. 애플리케이션 모니터링

```bash
# PM2 모니터링
pm2 monit

# 로그 확인
pm2 logs openclass

# 상태 확인
pm2 status
```

## 🔄 CI/CD 파이프라인

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /path/to/openclass
          git pull origin main
          npm install
          npm run build
          pm2 restart openclass
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - ssh user@server "cd /path/to/openclass && git pull && npm install && npm run build && pm2 restart openclass"
  only:
    - main
```

## 🔧 백업 및 복구

### 1. 데이터베이스 백업

```bash
# PostgreSQL 백업
pg_dump openclass > backup_$(date +%Y%m%d_%H%M%S).sql

# 자동 백업 스크립트
#!/bin/bash
BACKUP_DIR="/backup/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump openclass > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### 2. 파일 백업

```bash
# 업로드된 파일 백업
rsync -av /path/to/uploads/ /backup/uploads/

# 설정 파일 백업
cp .env /backup/config/env_$(date +%Y%m%d_%H%M%S)
```

### 3. 복구 절차

```bash
# 데이터베이스 복구
psql openclass < backup_20240120_120000.sql

# 파일 복구
rsync -av /backup/uploads/ /path/to/uploads/

# 애플리케이션 재시작
pm2 restart openclass
```

## 🚨 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   ```bash
   # 포트 사용 확인
   sudo netstat -tulpn | grep :3000
   
   # 프로세스 종료
   sudo kill -9 <PID>
   ```

2. **메모리 부족**
   ```bash
   # 메모리 사용량 확인
   free -h
   
   # Node.js 메모리 제한 설정
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

3. **데이터베이스 연결 실패**
   ```bash
   # PostgreSQL 상태 확인
   sudo systemctl status postgresql
   
   # 연결 테스트
   psql -h localhost -U postgres -d openclass
   ```

4. **SSL 인증서 문제**
   ```bash
   # 인증서 갱신
   sudo certbot renew
   
   # Nginx 설정 테스트
   sudo nginx -t
   ```

## 📞 지원

- **배포 문제**: GitHub Issues
- **문서**: [docs/](./) 디렉토리
- **긴급 상황**: 프로젝트 관리자에게 연락 