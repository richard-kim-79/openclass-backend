import dotenv from 'dotenv';
import path from 'path';

// 테스트 환경 변수 설정
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// 테스트 데이터베이스 설정
process.env.DB_PATH = path.join(__dirname, '../../data/test.db');
process.env.NODE_ENV = 'test';

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(30000);

// 콘솔 로그 억제 (테스트 중)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}); 