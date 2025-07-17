import db from './database';

export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // 강의실 테이블 생성
    db.run(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('강의실 테이블 생성 오류:', err);
        reject(err);
        return;
      }
      
      // 사용자 테이블 생성
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          name TEXT NOT NULL,
          avatar_url TEXT,
          provider TEXT DEFAULT 'local',
          provider_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('사용자 테이블 생성 오류:', err);
          reject(err);
          return;
        }
        
        // 스레드 테이블 생성
        db.run(`
          CREATE TABLE IF NOT EXISTS threads (
            id TEXT PRIMARY KEY,
            classroom_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT,
            author_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
            FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
          )
        `, (err) => {
          if (err) {
            console.error('스레드 테이블 생성 오류:', err);
            reject(err);
            return;
          }
          
          // 자료 테이블 생성 (파일 업로드 지원)
          db.run(`
            CREATE TABLE IF NOT EXISTS materials (
              id TEXT PRIMARY KEY,
              classroom_id TEXT NOT NULL,
              title TEXT NOT NULL,
              description TEXT,
              type TEXT NOT NULL,
              url TEXT,
              file_path TEXT,
              file_size INTEGER,
              mime_type TEXT,
              author_id TEXT,
              author_name TEXT NOT NULL,
              download_count INTEGER DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
              FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
            )
          `, (err) => {
            if (err) {
              console.error('자료 테이블 생성 오류:', err);
              reject(err);
              return;
            }
            
            // 검색을 위한 FTS5 가상 테이블 생성
            db.run(`
              CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
                id, type, title, content, classroom_id, classroom_name
              )
            `, (err) => {
              if (err) {
                console.error('검색 인덱스 생성 오류:', err);
                reject(err);
                return;
              }
              
              // 알림 테이블 생성
              db.run(`
                CREATE TABLE IF NOT EXISTS notifications (
                  id TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL,
                  type TEXT NOT NULL,
                  title TEXT NOT NULL,
                  message TEXT NOT NULL,
                  data TEXT,
                  is_read BOOLEAN DEFAULT FALSE,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                )
              `, (err) => {
                if (err) {
                  console.error('알림 테이블 생성 오류:', err);
                  reject(err);
                  return;
                }
                
                // 사용자 권한 테이블 생성
                db.run(`
                  CREATE TABLE IF NOT EXISTS user_permissions (
                    user_id TEXT NOT NULL,
                    classroom_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    permissions TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY (user_id, classroom_id),
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE
                  )
                `, (err) => {
                  if (err) {
                    console.error('사용자 권한 테이블 생성 오류:', err);
                    reject(err);
                    return;
                  }
                  
                  // 검색 히스토리 테이블 생성
                  db.run(`
                    CREATE TABLE IF NOT EXISTS search_history (
                      id TEXT PRIMARY KEY,
                      user_id TEXT NOT NULL,
                      query TEXT NOT NULL,
                      filters TEXT,
                      created_at TEXT NOT NULL,
                      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                    )
                  `, (err) => {
                    if (err) {
                      console.error('검색 히스토리 테이블 생성 오류:', err);
                      reject(err);
                      return;
                    }
                    
                    // 사용자 활동 테이블 생성
                    db.run(`
                      CREATE TABLE IF NOT EXISTS user_activity (
                        user_id TEXT PRIMARY KEY,
                        login_count INTEGER DEFAULT 0,
                        total_time INTEGER DEFAULT 0,
                        thread_count INTEGER DEFAULT 0,
                        reply_count INTEGER DEFAULT 0,
                        material_upload_count INTEGER DEFAULT 0,
                        material_download_count INTEGER DEFAULT 0,
                        last_activity TEXT,
                        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                      )
                    `, (err) => {
                      if (err) {
                        console.error('사용자 활동 테이블 생성 오류:', err);
                        reject(err);
                        return;
                      }
                      
                      // 활동 로그 테이블 생성
                      db.run(`
                        CREATE TABLE IF NOT EXISTS activity_log (
                          id TEXT PRIMARY KEY,
                          user_id TEXT,
                          type TEXT NOT NULL,
                          action TEXT NOT NULL,
                          target_id TEXT,
                          details TEXT,
                          created_at TEXT NOT NULL,
                          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
                        )
                      `, (err) => {
                        if (err) {
                          console.error('활동 로그 테이블 생성 오류:', err);
                          reject(err);
                          return;
                        }
                        
                        console.log('데이터베이스 초기화 완료');
                        resolve(true);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}; 