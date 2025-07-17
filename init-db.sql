-- ===========================================
-- OpenClass 데이터베이스 초기화 스크립트
-- ===========================================

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    provider VARCHAR(50) NOT NULL, -- 'google', 'naver', 'local'
    provider_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API 키 테이블
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 강의실 테이블
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT true,
    is_live BOOLEAN DEFAULT false,
    live_title VARCHAR(255),
    live_started_at TIMESTAMP WITH TIME ZONE,
    student_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 강의실 태그 테이블
CREATE TABLE IF NOT EXISTS classroom_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(classroom_id, tag)
);

-- 스레드 테이블
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 자료 테이블
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'file', 'youtube', 'link'
    url TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 관심사 테이블
CREATE TABLE IF NOT EXISTS user_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interest VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'learn', 'teach'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, interest, type)
);

-- 강의실 참여자 테이블
CREATE TABLE IF NOT EXISTS classroom_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'student', -- 'teacher', 'student', 'moderator'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(classroom_id, user_id)
);

-- 검색 인덱스 테이블 (RAG용)
CREATE TABLE IF NOT EXISTS search_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50) NOT NULL, -- 'classroom', 'thread', 'material'
    content_id UUID NOT NULL,
    content_text TEXT NOT NULL,
    embedding_vector REAL[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX IF NOT EXISTS idx_search_embeddings_content_type ON search_embeddings(content_type);
CREATE INDEX IF NOT EXISTS idx_search_embeddings_content_id ON search_embeddings(content_id);

-- 전체 텍스트 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_classrooms_title_description_gin ON classrooms USING gin(to_tsvector('korean', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_threads_content_gin ON threads USING gin(to_tsvector('korean', content));

-- 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classrooms_updated_at BEFORE UPDATE ON classrooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (개발용)
INSERT INTO users (id, email, name, provider, provider_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'teacher1@openclass.com', '김영희', 'local', 'teacher1'),
    ('550e8400-e29b-41d4-a716-446655440002', 'teacher2@openclass.com', '이개발', 'local', 'teacher2'),
    ('550e8400-e29b-41d4-a716-446655440003', 'teacher3@openclass.com', '최쿠키', 'local', 'teacher3')
ON CONFLICT (email) DO NOTHING;

INSERT INTO classrooms (id, title, description, teacher_id, teacher_name) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '초보자를 위한 영어 회화', '기초 영어 회화를 편안한 분위기에서 배워보세요!', '550e8400-e29b-41d4-a716-446655440001', '김영희'),
    ('660e8400-e29b-41d4-a716-446655440002', '파이썬 기초 프로그래밍', '프로그래밍이 처음이신가요? 파이썬으로 차근차근 시작해보세요.', '550e8400-e29b-41d4-a716-446655440002', '이개발'),
    ('660e8400-e29b-41d4-a716-446655440003', '홈베이킹 클래스', '집에서 만드는 맛있는 쿠키와 케이크 레시피를 공유해요!', '550e8400-e29b-41d4-a716-446655440003', '최쿠키')
ON CONFLICT (id) DO NOTHING;

INSERT INTO classroom_tags (classroom_id, tag) VALUES
    ('660e8400-e29b-41d4-a716-446655440001', '영어'),
    ('660e8400-e29b-41d4-a716-446655440002', '프로그래밍'),
    ('660e8400-e29b-41d4-a716-446655440003', '베이킹')
ON CONFLICT (classroom_id, tag) DO NOTHING; 