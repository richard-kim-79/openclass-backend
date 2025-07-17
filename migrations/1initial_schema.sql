-- ===========================================
-- OpenClass SQLite 초기 스키마 (리팩토링 버전)
-- ===========================================

-- 사용자 테이블 (리팩토링)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT, -- NULL 허용 (소셜 로그인용)
    name TEXT NOT NULL,
    avatar_url TEXT,
    provider TEXT NOT NULL DEFAULT 'local', -- local', google', 'naver'
    provider_id TEXT, -- 소셜 로그인 고유 ID
    is_active INTEGER DEFAULT 1, -- 활성화 여부
    is_verified INTEGER DEFAULT 0, -- 이메일 인증 여부
    email_verification_token TEXT, -- 이메일 인증 토큰
    email_verification_expires_at DATETIME, -- 이메일 인증 토큰 만료일
    password_reset_token TEXT, -- 비밀번호 재설정 토큰
    password_reset_expires_at DATETIME, -- 비밀번호 재설정 토큰 만료일
    last_login_at DATETIME, -- 마지막 로그인 시간
    deleted_at DATETIME, -- 탈퇴 시간 (소프트 삭제)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 이메일 인증 로그 테이블
CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 로그인 히스토리 테이블
CREATE TABLE IF NOT EXISTS login_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- local', google', 'naver'
    ip_address TEXT,
    user_agent TEXT,
    success INTEGER DEFAULT 1, -- 1: 성공,0 실패
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API 키 테이블
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    name TEXT,
    is_active INTEGER DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 강의실 테이블
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id TEXT,
    teacher_name TEXT NOT NULL,
    is_public INTEGER DEFAULT 1,
    is_live INTEGER DEFAULT 0,
    live_title TEXT,
    live_started_at DATETIME,
    student_count INTEGER DEFAULT 0,
    max_students INTEGER DEFAULT 100,
    category TEXT,
    tags TEXT, -- JSON 형태로 저장
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 강의실 태그 테이블
CREATE TABLE IF NOT EXISTS classroom_tags (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    UNIQUE(classroom_id, tag)
);

-- 강의실 참여자 테이블
CREATE TABLE IF NOT EXISTS classroom_participants (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student', -- student, acher, istant
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    left_at DATETIME,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(classroom_id, user_id)
);

-- 스레드 테이블
CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id TEXT, -- 대댓글용
    is_deleted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 자료 테이블
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_by_name TEXT NOT NULL,
    download_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'system', 'classroom', 'thread', 'material'
    related_id TEXT, -- 관련 ID (classroom_id, thread_id 등)
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 실시간 채팅 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', --text,file',system'
    file_path TEXT,
    file_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_threads_classroom_id ON threads(classroom_id);
CREATE INDEX IF NOT EXISTS idx_threads_author_id ON threads(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_materials_classroom_id ON materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_classroom_id ON chat_messages(classroom_id); 