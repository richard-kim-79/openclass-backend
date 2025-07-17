import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import classroomRoutes from './routes/classroomRoutes';
import userRoutes from './routes/userRoutes';
import searchRoutes from './routes/searchRoutes';
import threadRoutes from './routes/threadRoutes';
import materialRoutes from './routes/materialRoutes';
import passport from './config/passport';
import authRoutes from './routes/authRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { NotificationHandler } from './socket/notificationHandler';
import analyticsRoutes from './routes/analyticsRoutes';
import { swaggerUi, specs } from './config/swagger';
import { initializeDatabase, createTables, testDatabaseConnection } from './config/database';
import db from './config/database';
import { runMigrations } from './config/migrations';
import { RealtimeService } from './services/realtime';
import { CacheService } from './services/cacheService';
import { CacheMiddleware } from './middleware/cacheMiddleware';
import optimizedClassroomRoutes from './routes/optimizedClassroomRoutes';
import healthRoutes from './routes/healthRoutes';
import logRoutes from './routes/logRoutes';
import { loggingMiddleware, errorLoggingMiddleware } from './middleware/loggingMiddleware';

// 환경 변수 로딩
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = NODE_ENV === 'test' ? 'env.test' : 'env.development';

if (NODE_ENV !== 'production') {
  dotenv.config({ path: envFile });
}

const app = express();
const server = createServer(app);

const DEFAULT_PORT = parseInt(process.env.PORT || '3001', 10);

// 기본 미들웨어 설정
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());

// CORS 설정
app.use(cors({
  origin: true, // 모든 origin 허용 (개발 환경)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 수
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
});
app.use('/api/', limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 로깅 미들웨어
app.use(loggingMiddleware);

// 정적 파일 서빙 (캐시 헤더 적용)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
  maxAge: '30d',
  immutable: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  }
}));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'OpenClass API 서버가 실행 중입니다.',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      classrooms: '/api/classrooms',
      threads: '/api/threads',
      materials: '/api/materials',
      search: '/api/search',
      analytics: '/api/analytics',
      logs: '/api/logs',
      docs: '/api-docs'
    }
  });
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// Passport.js 초기화
app.use(passport.initialize());
app.use(passport.session());

// 알림 핸들러 초기화
const notificationHandler = new NotificationHandler(server);

// API 라우트
app.use('/api/classrooms', classroomRoutes);
app.use('/api/optimized/classrooms', optimizedClassroomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', threadRoutes); // 스레드 라우트
app.use('/api', materialRoutes); // 자료 라우트
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes); // 프론트엔드 호환성을 위해 추가
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/logs', logRoutes);

// Swagger API 문서화
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: '요청한 리소스를 찾을 수 없습니다.',
    path: req.originalUrl
  });
});

// 에러 로깅 미들웨어
app.use(errorLoggingMiddleware);

// 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ 서버 에러:', err);
  
  if (NODE_ENV === 'development') {
    res.status(500).json({ 
      success: false,
      error: err.message,
      stack: err.stack 
    });
  } else {
    res.status(500).json({ 
      success: false,
      error: '서버 오류가 발생했습니다.' 
    });
  }
});

// 서버 시작 함수
const startServer = async (port: number): Promise<void> => {
  try {
    // 데이터베이스 초기화
    await initializeApp();
    
    // 캐싱 서비스 초기화
    const cacheService = new CacheService(db);
    const cacheMiddleware = new CacheMiddleware(cacheService);
    
    // 실시간 서비스 초기화
    const realtimeService = new RealtimeService(server, db);
    
    // 캐시 관리 엔드포인트 설정
    app.get('/api/cache/stats', cacheMiddleware.getCacheStats());
    app.post('/api/cache/clear', cacheMiddleware.clearCache());
    
    server.listen(port, () => {
      console.log(`🚀 OpenClass 서버가 포트 ${port}에서 실행 중입니다.`);
      console.log(`📊 환경: ${NODE_ENV}`);
      console.log(`🌐 서버 URL: http://localhost:${port}`);
      console.log(`🔗 클라이언트 URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`📚 API 문서: http://localhost:${port}/api-docs`);
    });

    // 포트 충돌 처리
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ 포트 ${port}가 사용 중입니다. 포트 ${port + 1}로 재시도합니다.`);
        startServer(port + 1);
      } else {
        console.error('❌ 서버 시작 실패:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 애플리케이션 초기화 함수
const initializeApp = async (): Promise<void> => {
  try {
    console.log('🔧 애플리케이션 초기화 중...');
    
    // 데이터베이스 연결 테스트
    await testDatabaseConnection();
    console.log('✅ 데이터베이스 연결 성공');
    
    // 마이그레이션 실행
    await runMigrations();
    console.log('✅ 데이터베이스 마이그레이션 완료');
    
    console.log('✅ 애플리케이션 초기화 완료');
  } catch (error) {
    console.error('❌ 애플리케이션 초기화 실패:', error);
    throw error;
  }
};

// 서버 시작
startServer(DEFAULT_PORT);

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 서버 종료 신호를 받았습니다.');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 서버를 종료합니다.');
  process.exit(0);
});

export { app, server }; 