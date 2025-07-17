-- ===========================================
-- OpenClass SQLite 초기 스키마 (베타용)
-- ===========================================

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    provider TEXT NOT NULL, -- 'google', 'naver', 'local'
    provider_id TEXT,
    is_active INTEGER DEFAULT 1,
    is_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- 스레드 테이블
CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_id TEXT,
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES threads(id) ON DELETE CASCADE
);

-- 자료 테이블
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'file', 'youtube', 'link'
    url TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    author_id TEXT,
    author_name TEXT NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 사용자 관심사 테이블
CREATE TABLE IF NOT EXISTS user_interests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    interest TEXT NOT NULL,
    type TEXT NOT NULL, -- 'learn', 'teach'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, interest, type)
);

-- 강의실 참여자 테이블
CREATE TABLE IF NOT EXISTS classroom_participants (
    id TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'student', -- 'teacher', 'student', 'moderator'
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(classroom_id, user_id)
);

-- 검색 인덱스 테이블 (간단한 검색용)
CREATE TABLE IF NOT EXISTS search_index (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL, -- 'classroom', 'thread', 'material'
    content_id TEXT NOT NULL,
    content_text TEXT NOT NULL,
    title TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_created_at ON classrooms(created_at);
CREATE INDEX IF NOT EXISTS idx_classrooms_is_public ON classrooms(is_public);
CREATE INDEX IF NOT EXISTS idx_threads_classroom_id ON threads(classroom_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at);
CREATE INDEX IF NOT EXISTS idx_materials_classroom_id ON materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_search_index_content_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_search_index_content_id ON search_index(content_id);

-- 전체 텍스트 검색 인덱스 (SQLite FTS5 사용)
CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
    content_text,
    title,
    tags,
    content_type,
    content_id,
    tokenize='porter'
);

-- 샘플 데이터 삽입 (베타용)
INSERT OR IGNORE INTO users (id, email, name, provider, provider_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'teacher1@openclass.com', '김영희', 'local', 'teacher1'),
    ('550e8400-e29b-41d4-a716-446655440002', 'teacher2@openclass.com', '이개발', 'local', 'teacher2'),
    ('550e8400-e29b-41d4-a716-446655440003', 'teacher3@openclass.com', '최쿠키', 'local', 'teacher3');

INSERT OR IGNORE INTO classrooms (id, title, description, teacher_id, teacher_name) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '초보자를 위한 영어 회화', '기초 영어 회화를 편안한 분위기에서 배워보세요!', '550e8400-e29b-41d4-a716-446655440001', '김영희'),
    ('660e8400-e29b-41d4-a716-446655440002', '파이썬 기초 프로그래밍', '프로그래밍이 처음이신가요? 파이썬으로 차근차근 시작해보세요.', '550e8400-e29b-41d4-a716-446655440002', '이개발'),
    ('660e8400-e29b-41d4-a716-446655440003', '홈베이킹 클래스', '집에서 만드는 맛있는 쿠키와 케이크 레시피를 공유해요!', '550e8400-e29b-41d4-a716-446655440003', '최쿠키');

INSERT OR IGNORE INTO classroom_tags (id, classroom_id, tag) VALUES
    ('tag1', '660e8400-e29b-41d4-a716-446655440001', '영어'),
    ('tag2', '660e8400-e29b-41d4-a716-446655440002', '프로그래밍'),
    ('tag3', '660e8400-e29b-41d4-a716-446655440003', '베이킹'); 