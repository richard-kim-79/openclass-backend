#!/bin/bash

# ===========================================
# OpenClass 자동 백업 스크립트
# ===========================================

set -e

# 환경 변수 설정
BACKUP_DIR="./backups"
DB_PATH="./data/openclass.dev.db"
UPLOAD_DIR="./uploads"
LOG_DIR="./logs"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# 백업 디렉토리 생성
create_backup_dirs() {
    log "백업 디렉토리를 생성합니다..."
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/uploads"
    mkdir -p "$BACKUP_DIR/logs"
    mkdir -p "$BACKUP_DIR/complete"
}

# 데이터베이스 백업
backup_database() {
    log "데이터베이스를 백업합니다..."
    
    if [ ! -f "$DB_PATH" ]; then
        error "데이터베이스 파일을 찾을 수 없습니다: $DB_PATH"
        return 1
    fi
    
    BACKUP_DB="$BACKUP_DIR/database/openclass_$DATE.db"
    cp "$DB_PATH" "$BACKUP_DB"
    
    if [ $? -eq 0 ]; then
        log "데이터베이스 백업 완료: $BACKUP_DB"
        echo "$BACKUP_DB" >> "$BACKUP_DIR/database/backup_list.txt"
    else
        error "데이터베이스 백업 실패"
        return 1
    fi
}

# 업로드 파일 백업
backup_uploads() {
    log "업로드 파일을 백업합니다..."
    
    if [ ! -d "$UPLOAD_DIR" ]; then
        warning "업로드 디렉토리가 없습니다: $UPLOAD_DIR"
        return 0
    fi
    
    BACKUP_UPLOADS="$BACKUP_DIR/uploads/uploads_$DATE.tar.gz"
    tar -czf "$BACKUP_UPLOADS" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"
    
    if [ $? -eq 0 ]; then
        log "업로드 파일 백업 완료: $BACKUP_UPLOADS"
        echo "$BACKUP_UPLOADS" >> "$BACKUP_DIR/uploads/backup_list.txt"
    else
        error "업로드 파일 백업 실패"
        return 1
    fi
}

# 로그 파일 백업
backup_logs() {
    log "로그 파일을 백업합니다..."
    
    if [ ! -d "$LOG_DIR" ]; then
        warning "로그 디렉토리가 없습니다: $LOG_DIR"
        return 0
    fi
    
    BACKUP_LOGS="$BACKUP_DIR/logs/logs_$DATE.tar.gz"
    tar -czf "$BACKUP_LOGS" -C "$(dirname "$LOG_DIR")" "$(basename "$LOG_DIR")"
    
    if [ $? -eq 0 ]; then
        log "로그 파일 백업 완료: $BACKUP_LOGS"
        echo "$BACKUP_LOGS" >> "$BACKUP_DIR/logs/backup_list.txt"
    else
        error "로그 파일 백업 실패"
        return 1
    fi
}

  # 완전한 백업 생성
  create_complete_backup() {
    log "완전한 백업을 생성합니다..."
    
    COMPLETE_BACKUP="$BACKUP_DIR/complete/openclass_complete_$DATE.tar.gz"
    
    # 임시 디렉토리에서 완전한 백업 생성
    cd "$BACKUP_DIR"
    tar -czf "complete/openclass_complete_$DATE.tar.gz" \
      "database/openclass_$DATE.db" \
      "uploads/uploads_$DATE.tar.gz" \
      "logs/logs_$DATE.tar.gz"
    
    if [ $? -eq 0 ]; then
      log "완전한 백업 생성 완료: $COMPLETE_BACKUP"
      echo "$COMPLETE_BACKUP" >> "$BACKUP_DIR/complete/backup_list.txt"
    else
      error "완전한 백업 생성 실패"
      return 1
    fi
  }

# 오래된 백업 정리
cleanup_old_backups() {
    log "오래된 백업을 정리합니다..."
    
    # 데이터베이스 백업 정리
    find "$BACKUP_DIR/database" -name "openclass_*.db" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # 업로드 백업 정리
    find "$BACKUP_DIR/uploads" -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # 로그 백업 정리
    find "$BACKUP_DIR/logs" -name "logs_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # 완전한 백업 정리
    find "$BACKUP_DIR/complete" -name "openclass_complete_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    log "오래된 백업 정리 완료 (보관 기간: $RETENTION_DAYS일)"
}

# 백업 통계 생성
generate_backup_stats() {
    log "백업 통계를 생성합니다..."
    
    STATS_FILE="$BACKUP_DIR/backup_stats.txt"
    
    echo "=== OpenClass 백업 통계 ===" > "$STATS_FILE"
    echo "생성일: $(date)" >> "$STATS_FILE"
    echo "" >> "$STATS_FILE"
    
    echo "데이터베이스 백업:" >> "$STATS_FILE"
    ls -la "$BACKUP_DIR/database/"*.db 2>/dev/null | wc -l | tr -d ' ' >> "$STATS_FILE"
    echo "개" >> "$STATS_FILE"
    
    echo "업로드 백업:" >> "$STATS_FILE"
    ls -la "$BACKUP_DIR/uploads/"*.tar.gz 2>/dev/null | wc -l | tr -d ' ' >> "$STATS_FILE"
    echo "개" >> "$STATS_FILE"
    
    echo "완전한 백업:" >> "$STATS_FILE"
    ls -la "$BACKUP_DIR/complete/"*.tar.gz 2>/dev/null | wc -l | tr -d ' ' >> "$STATS_FILE"
    echo "개" >> "$STATS_FILE"
    
    echo "" >> "$STATS_FILE"
    echo "총 백업 크기:" >> "$STATS_FILE"
    du -sh "$BACKUP_DIR" | cut -f1 >> "$STATS_FILE"
    
    log "백업 통계 생성 완료: $STATS_FILE"
}

# 메인 함수
main() {
    log "OpenClass 백업을 시작합니다..."
    
    # 백업 디렉토리 생성
    create_backup_dirs
    
    # 각종 백업 실행
    backup_database
    backup_uploads
    backup_logs
    
    # 완전한 백업 생성
    create_complete_backup
    
    # 오래된 백업 정리
    cleanup_old_backups
    
    # 백업 통계 생성
    generate_backup_stats
    
    log "백업이 성공적으로 완료되었습니다!"
}

# 스크립트 실행
main "$@" 