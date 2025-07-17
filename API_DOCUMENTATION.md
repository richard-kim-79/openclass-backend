# OpenClass API 문서

## 📋 개요

OpenClass API는 온라인 강의실 플랫폼을 위한 RESTful API입니다. 실시간 채팅, 파일 업로드, 권한 관리 등의 기능을 제공합니다.

**기본 URL**: `http://localhost:3001`  
**API 버전**: v1  
**인증 방식**: JWT Bearer Token

## 🔐 인증

### JWT 토큰 사용
```bash
# 요청 헤더에 토큰 포함
Authorization: Bearer <your-jwt-token>
```

### 토큰 획득
```bash
# 로그인 후 받은 토큰을 저장
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 👥 사용자 관리

### 회원가입
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "사용자 이름"
}
```

**응답**:
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "user": {
      "id": "1752643047409",
      "email": "user@example.com",
      "name": "사용자 이름",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 로그인
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답**:
```json
{
  "success": true,
  "message": "로그인이 완료되었습니다.",
  "data": {
    "user": {
      "id": "1752643047409",
      "email": "user@example.com",
      "name": "사용자 이름",
      "role": "student"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 프로필 조회
```http
GET /api/users/profile
Authorization: Bearer <token>
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "1752643047409",
    "email": "user@example.com",
    "name": "사용자 이름",
    "role": "student",
    "created_at": "2025-07-16T05:29:35.744Z"
  }
}
```

## 🏫 강의실 관리

### 강의실 목록 조회
```http
GET /api/classrooms
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `teacherId`: 강사 ID로 필터링
- `isPublic`: 공개 여부로 필터링 (true/false)

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "초보자를 위한 영어 회화",
      "description": "기초 영어 회화를 편안한 분위기에서 배워보세요!",
      "teacher_id": "550e8400-e29b-41d4-a716-446655440001",
      "teacher_name": "김영희",
      "is_public": true,
      "student_count": 0,
      "created_at": "2025-07-15T03:43:07.000Z",
      "updated_at": "2025-07-15T03:43:07.000Z"
    }
  ]
}
```

### 강의실 생성
```http
POST /api/classrooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "새 강의실",
  "description": "강의실 설명",
  "is_public": true
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "1752642505935",
    "title": "새 강의실",
    "description": "강의실 설명",
    "teacher_id": "1752643047409",
    "teacher_name": "사용자 이름",
    "is_public": true,
    "student_count": 0,
    "created_at": "2025-07-16T05:08:25.935Z",
    "updated_at": "2025-07-16T05:08:25.935Z"
  }
}
```

### 강의실 상세 조회
```http
GET /api/classrooms/{id}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "초보자를 위한 영어 회화",
    "description": "기초 영어 회화를 편안한 분위기에서 배워보세요!",
    "teacher_id": "550e8400-e29b-41d4-a716-446655440001",
    "teacher_name": "김영희",
    "is_public": true,
    "student_count": 0,
    "thread_count": 5,
    "material_count": 3,
    "created_at": "2025-07-15T03:43:07.000Z",
    "updated_at": "2025-07-15T03:43:07.000Z"
  }
}
```

### 강의실 수정
```http
PUT /api/classrooms/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "수정된 강의실 제목",
  "description": "수정된 설명",
  "is_public": false
}
```

### 강의실 삭제
```http
DELETE /api/classrooms/{id}
Authorization: Bearer <token>
```

## 🔍 검색

### 통합 검색
```http
GET /api/search?q={검색어}
```

**쿼리 파라미터**:
- `q`: 검색어 (필수)
- `type`: 검색 타입 (classroom, thread, material, user, all)
- `page`: 페이지 번호
- `limit`: 페이지당 항목 수

**응답**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "classroom",
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "초보자를 위한 영어 회화",
        "description": "기초 영어 회화를 편안한 분위기에서 배워보세요!",
        "instructor": "김영희",
        "created_at": "2025-07-15T03:43:07.000Z"
      }
    ],
    "total": 1,
    "query": "영어",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 강의실 검색
```http
GET /api/search/classrooms?q={검색어}
```

### 자료 검색
```http
GET /api/search/materials?q={검색어}
```

## 📝 스레드 관리

### 스레드 목록 조회
```http
GET /api/classrooms/{classroomId}/threads
```

### 스레드 생성
```http
POST /api/classrooms/{classroomId}/threads
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "스레드 내용"
}
```

### 스레드 상세 조회
```http
GET /api/threads/{threadId}
```

### 스레드 수정
```http
PUT /api/threads/{threadId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "수정된 내용"
}
```

### 스레드 삭제
```http
DELETE /api/threads/{threadId}
Authorization: Bearer <token>
```

## 📁 자료 관리

### 자료 목록 조회
```http
GET /api/classrooms/{classroomId}/materials
```

### 자료 업로드
```http
POST /api/classrooms/{classroomId}/materials
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "자료 제목",
  "description": "자료 설명",
  "file": <파일>
}
```

### 자료 다운로드
```http
GET /api/materials/{materialId}/download
```

### 자료 삭제
```http
DELETE /api/materials/{materialId}
Authorization: Bearer <token>
```

## 🔔 알림 관리

### 알림 목록 조회
```http
GET /api/notifications/user/{userId}
Authorization: Bearer <token>
```

### 알림 읽음 처리
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

### 모든 알림 읽음 처리
```http
PUT /api/notifications/user/{userId}/read-all
Authorization: Bearer <token>
```

## 📊 분석

### 시스템 통계
```http
GET /api/analytics
Authorization: Bearer <token>
```

**응답**:
```json
{
  "success": true,
  "data": {
    "system_stats": {
      "total_users": 150,
      "total_classrooms": 25,
      "total_threads": 300,
      "total_materials": 150,
      "active_users_today": 45,
      "active_users_week": 120,
      "active_users_month": 150
    },
    "popular_content": [
      {
        "id": "1",
        "type": "classroom",
        "title": "인기 강의실",
        "view_count": 150
      }
    ],
    "growth_trend": [
      {
        "date": "2025-07-16",
        "new_users": 5,
        "new_classrooms": 2,
        "new_threads": 15,
        "new_materials": 8
      }
    ]
  }
}
```

### 사용자 통계
```http
GET /api/analytics/user/{userId}
Authorization: Bearer <token>
```

### 강의실 통계
```http
GET /api/analytics/classroom/{classroomId}
Authorization: Bearer <token>
```

## 🏥 헬스체크

### 기본 헬스체크
```http
GET /api/health
```

**응답**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-16T05:29:35.744Z",
  "uptime": 3600,
  "memory": {
    "rss": 180,
    "heapTotal": 150,
    "heapUsed": 120,
    "external": 8
  },
  "environment": "development",
  "version": "1.0.0-beta.1"
}
```

### 상세 헬스체크
```http
GET /api/health/detailed
```

**응답**:
```json
{
  "status": "healthy",
  "timestamp": "2025-07-16T05:29:39.257Z",
  "checks": {
    "database": true,
    "memory": true,
    "disk": true
  },
  "memory": {
    "rss": 180,
    "heapTotal": 150,
    "heapUsed": 120,
    "external": 8
  },
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0-beta.1"
}
```

## 🔄 실시간 기능 (Socket.IO)

### 연결 설정
```javascript
// 클라이언트에서 Socket.IO 연결
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### 이벤트 목록

#### 클라이언트 → 서버
- `join_classroom`: 강의실 참여
- `leave_classroom`: 강의실 퇴장
- `send_message`: 채팅 메시지 전송
- `mark_notification_read`: 알림 읽음 처리

#### 서버 → 클라이언트
- `new_message`: 새 채팅 메시지
- `new_notification`: 새 알림
- `notification_updated`: 알림 상태 업데이트
- `user_joined`: 사용자 참여 알림
- `user_left`: 사용자 퇴장 알림

### 예시 사용법
```javascript
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

// 새 알림 수신
socket.on('new_notification', (notification) => {
  console.log('새 알림:', notification);
});
```

## 🚨 에러 처리

### 에러 응답 형식
```json
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

### 주요 에러 코드
- `AUTH_REQUIRED`: 인증이 필요합니다
- `PERMISSION_DENIED`: 권한이 없습니다
- `RESOURCE_NOT_FOUND`: 리소스를 찾을 수 없습니다
- `VALIDATION_ERROR`: 입력값 검증 실패
- `RATE_LIMIT_EXCEEDED`: 요청 한도를 초과했습니다

### HTTP 상태 코드
- `200`: 성공
- `201`: 생성됨
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `429`: 요청 한도 초과
- `500`: 서버 오류
- `503`: 서비스 불가

## 📝 사용 예시

### 전체 워크플로우
```bash
# 1. 회원가입
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"사용자"}'

# 2. 로그인
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 3. 토큰 저장
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. 강의실 생성
curl -X POST http://localhost:3001/api/classrooms \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"새 강의실","description":"강의실 설명","is_public":true}'

# 5. 강의실 목록 조회
curl -X GET http://localhost:3001/api/classrooms

# 6. 헬스체크
curl -X GET http://localhost:3001/api/health
```

## 🔗 관련 문서

- [개발 작업 요약](./DEVELOPMENT_SUMMARY.md)
- [프로젝트 상태](./PROJECT_STATUS.md)
- [Swagger API 문서](http://localhost:3001/api-docs)

---

**API 버전**: v1  
**최종 업데이트**: 2025-07-16  
**문서 작성자**: OpenClass 개발팀 