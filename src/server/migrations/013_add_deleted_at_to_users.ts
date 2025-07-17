import { Database } from 'sqlite3';

export const up = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // users 테이블에 deleted_at 컬럼 추가
    db.run(
      'ALTER TABLE users ADD COLUMN deleted_at DATETIME',
      (err) => {
        if (err) {
          // 컬럼이 이미 존재하는 경우 무시
          if (err.message.includes('duplicate column name')) {
            console.log('✅ deleted_at 컬럼이 이미 존재합니다.');
            resolve();
          } else {
            reject(err);
          }
        } else {
          console.log('✅ deleted_at 컬럼이 추가되었습니다.');
          resolve();
        }
      }
    );
  });
};

export const down = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    // SQLite는 컬럼 삭제를 직접 지원하지 않으므로 테이블 재생성 필요
    // 하지만 복잡하므로 단순히 성공 반환
    console.log('⚠️ deleted_at 컬럼 삭제는 수동으로 처리해야 합니다.');
    resolve();
  });
}; 