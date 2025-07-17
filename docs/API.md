# OpenClass API 문서

## 🔐 인증

### API 키 발급

```http
POST /api/auth/generate-key
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "apiKey": "oc_abc123def456ghi789",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

### API 키 인증

모든 API 요청에 헤더를 포함하세요:

```http
Authorization: Bearer oc_abc123def456ghi789
```

## 🎓 강의실 API

### 강의실 목록 조회

```http
GET /api/classrooms?page=1&limit=10&search=영어&tags=영어,프로그래밍
```

**응답:**
```json
{
  "success": true,
  "data": {
    "classrooms": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "초보자를 위한 영어 회화",
        "description": "기초 영어 회화를 편안한 분위기에서 배워보세요!",
        "teacherName": "김영희",
        "tags": ["영어"],
        "studentCount": 15,
        "isLive": false,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 강의실 상세 조회

```http
GET /api/classrooms/:id
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "초보자를 위한 영어 회화",
    "description": "기초 영어 회화를 편안한 분위기에서 배워보세요!",
    "teacherId": "550e8400-e29b-41d4-a716-446655440001",
    "teacherName": "김영희",
    "tags": ["영어"],
    "studentCount": 15,
    "isLive": false,
    "liveTitle": null,
    "liveStartedAt": null,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

### 강의실 생성

```http
POST /api/classrooms
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "새로운 강의실",
  "description": "강의실 설명",
  "tags": ["태그1", "태그2"],
  "isPublic": true
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440004",
    "title": "새로운 강의실",
    "description": "강의실 설명",
    "teacherId": "550e8400-e29b-41d4-a716-446655440001",
    "teacherName": "김영희",
    "tags": ["태그1", "태그2"],
    "studentCount": 1,
    "isLive": false,
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

### 강의실 수정

```http
PUT /api/classrooms/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "수정된 강의실 제목",
  "description": "수정된 설명",
  "tags": ["수정된태그1", "수정된태그2"]
}
```

### 강의실 삭제

```http
DELETE /api/classrooms/:id
Authorization: Bearer <access_token>
```

## 💬 스레드 API

### 스레드 목록 조회

```http
GET /api/classrooms/:classroomId/threads?page=1&limit=20
```

**응답:**
```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "classroomId": "660e8400-e29b-41d4-a716-446655440001",
        "authorId": "550e8400-e29b-41d4-a716-446655440001",
        "authorName": "김영희",
        "content": "안녕하세요! 첫 수업 시작하겠습니다.",
        "parentId": null,
        "isPinned": false,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 스레드 생성

```http
POST /api/classrooms/:classroomId/threads
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "새로운 메시지입니다.",
  "parentId": null
}
```

### 스레드 수정

```http
PUT /api/threads/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "수정된 메시지입니다."
}
```

### 스레드 삭제

```http
DELETE /api/threads/:id
Authorization: Bearer <access_token>
```

## 📚 자료 API

### 자료 목록 조회

```http
GET /api/classrooms/:classroomId/materials?type=all&page=1&limit=10
```

**응답:**
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440001",
        "classroomId": "660e8400-e29b-41d4-a716-446655440001",
        "title": "영어 회화 교재",
        "description": "기초 영어 회화 교재 PDF",
        "type": "file",
        "url": "https://openclass-uploads.s3.amazonaws.com/materials/english-textbook.pdf",
        "fileSize": 2048576,
        "mimeType": "application/pdf",
        "authorId": "550e8400-e29b-41d4-a716-446655440001",
        "authorName": "김영희",
        "downloadCount": 5,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

### 자료 업로드

```http
POST /api/classrooms/:classroomId/materials
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "title": "자료 제목",
  "description": "자료 설명",
  "type": "file",
  "file": <file>
}
```

### 유튜브 링크 추가

```http
POST /api/classrooms/:classroomId/materials
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "영어 회화 영상",
  "description": "기초 영어 회화 학습 영상",
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=example"
}
```

### 자료 삭제

```http
DELETE /api/materials/:id
Authorization: Bearer <access_token>
```

## 🔍 검색 API

### 통합 검색 (베타용)

```http
GET /api/search?q=영어회화&type=all&limit=10
```

**응답:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "classroom",
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "초보자를 위한 영어 회화",
        "content": "기초 영어 회화를 편안한 분위기에서 배워보세요!",
        "url": "/classrooms/660e8400-e29b-41d4-a716-446655440001"
      },
      {
        "type": "thread",
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "title": "영어 회화 - 김영희",
        "content": "안녕하세요! 첫 수업 시작하겠습니다.",
        "url": "/classrooms/660e8400-e29b-41d4-a716-446655440001#thread-770e8400-e29b-41d4-a716-446655440001"
      }
    ],
    "total": 15,
    "query": "영어회화"
  }
}
```

### 강의실 검색

```http
GET /api/search/classrooms?q=검색어&tags=태그1,태그2&page=1&limit=10
```

### 스레드 검색

```http
GET /api/search/threads?q=검색어&classroomId=강의실ID&page=1&limit=10
```

### 자료 검색

```http
GET /api/search/materials?q=검색어&type=file&page=1&limit=10
```

## 🎥 라이브 강의 API

### 라이브 시작

```http
POST /api/classrooms/:id/live/start
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "라이브 강의 제목",
  "description": "라이브 강의 설명"
}
```

### 라이브 종료

```http
POST /api/classrooms/:id/live/end
Authorization: Bearer <access_token>
```

### 라이브 상태 조회

```http
GET /api/classrooms/:id/live/status
```

**응답:**
```json
{
  "success": true,
  "data": {
    "isLive": true,
    "title": "라이브 강의 제목",
    "startedAt": "2024-01-20T10:00:00Z",
    "viewerCount": 25,
    "streamUrl": "rtmp://live.openclass.com/live/stream123"
  }
}
```

## 👥 사용자 API

### 사용자 프로필 조회

```http
GET /api/users/profile
Authorization: Bearer <access_token>
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "teacher@openclass.com",
    "name": "김영희",
    "avatarUrl": "https://example.com/avatar.jpg",
    "provider": "google",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 관심사 설정

```http
POST /api/users/interests
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "interests": [
    {
      "interest": "영어",
      "type": "learn"
    },
    {
      "interest": "프로그래밍",
      "type": "teach"
    }
  ]
}
```

### 사용자 강의실 목록

```http
GET /api/users/classrooms?role=teacher&page=1&limit=10
Authorization: Bearer <access_token>
```

## 🔐 OAuth API

### Google 로그인

```http
GET /auth/google
```

### Google 콜백

```http
GET /auth/google/callback
```

### Naver 로그인

```http
GET /auth/naver
```

### Naver 콜백

```http
GET /auth/naver/callback
```

## 📊 통계 API

### 강의실 통계

```http
GET /api/classrooms/:id/stats
```

**응답:**
```json
{
  "success": true,
  "data": {
    "studentCount": 15,
    "threadCount": 25,
    "materialCount": 8,
    "liveSessionCount": 3,
    "totalLiveTime": 5400,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### 사용자 통계

```http
GET /api/users/stats
Authorization: Bearer <access_token>
```

## 🚨 에러 응답

### 일반적인 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 유효하지 않습니다.",
    "details": [
      {
        "field": "title",
        "message": "제목은 필수입니다."
      }
    ]
  }
}
```

### 에러 코드

- `AUTHENTICATION_ERROR`: 인증 실패
- `AUTHORIZATION_ERROR`: 권한 없음
- `VALIDATION_ERROR`: 입력 데이터 오류
- `NOT_FOUND`: 리소스를 찾을 수 없음
- `CONFLICT`: 리소스 충돌
- `RATE_LIMIT_EXCEEDED`: 요청 제한 초과
- `INTERNAL_SERVER_ERROR`: 서버 내부 오류

## 📝 요청 제한

- **일반 사용자**: 1000 요청/시간
- **API 키 사용자**: 10000 요청/시간
- **파일 업로드**: 최대 10MB
- **검색 요청**: 최대 100개 결과

## 🔗 WebSocket 이벤트

### 연결

```javascript
const socket = io('https://api.openclass.com');

// 강의실 참여
socket.emit('join-classroom', { classroomId: 'classroom-id' });

// 메시지 수신
socket.on('new-thread', (data) => {
  console.log('새로운 스레드:', data);
});

// 라이브 상태 변경
socket.on('live-status-changed', (data) => {
  console.log('라이브 상태 변경:', data);
});
```

### 이벤트 목록

- `new-thread`: 새로운 스레드 생성
- `thread-updated`: 스레드 수정
- `thread-deleted`: 스레드 삭제
- `new-material`: 새로운 자료 추가
- `live-started`: 라이브 시작
- `live-ended`: 라이브 종료
- `user-joined`: 사용자 참여
- `user-left`: 사용자 퇴장 