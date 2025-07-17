import http from 'http';
import db from './config/database';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 3000
};

const healthCheck = () => {
  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ 헬스체크 성공');
      process.exit(0);
    } else {
      console.error('❌ 헬스체크 실패:', res.statusCode);
      process.exit(1);
    }
  });

  req.on('error', (err) => {
    console.error('❌ 헬스체크 오류:', err);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('❌ 헬스체크 타임아웃');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

// 데이터베이스 연결 테스트
const testDatabase = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1 as test', (err, row) => {
      if (err) {
        console.error('❌ 데이터베이스 연결 실패:', err);
        reject(err);
      } else {
        console.log('✅ 데이터베이스 연결 성공');
        resolve(row);
      }
    });
  });
};

// 메인 헬스체크
const main = async () => {
  try {
    // 데이터베이스 연결 테스트
    await testDatabase();
    
    // HTTP 헬스체크
    healthCheck();
  } catch (error) {
    console.error('❌ 헬스체크 실패:', error);
    process.exit(1);
  }
};

main(); 