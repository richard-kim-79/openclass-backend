import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '이름, 이메일, 비밀번호는 필수입니다.'
      });
    }

    // 이메일 중복 확인
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    }) as any;

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '이미 존재하는 이메일입니다.'
      });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성 (단순화된 스키마)
    const userId = require('crypto').randomUUID();
    const now = new Date().toISOString();
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (id, email, password, name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, hashedPassword, name, 'student', now, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        }
      );
    });

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        id: userId,
        name,
        email,
        role: 'student'
      },
      token
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    return res.status(500).json({
      success: false,
      error: '회원가입 중 오류가 발생했습니다.'
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호는 필수입니다.'
      });
    }

    // 사용자 조회
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    }) as any;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'student'
      },
      token
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    });
  }
});

// Google OAuth 로그인
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth 콜백
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: req.user?.id, email: req.user?.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // 클라이언트로 리다이렉트 (토큰 포함)
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
  }
);

// Naver OAuth 로그인
// router.get('/naver', passport.authenticate('naver'));

// Naver OAuth 콜백
// router.get('/naver/callback',
//   passport.authenticate('naver', { failureRedirect: '/login' }),
//   (req, res) => {
//     // JWT 토큰 생성
//     const token = jwt.sign(
//       { userId: req.user?.id, email: req.user?.email },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '7d' }
//     );
//     // 클라이언트로 리다이렉트 (토큰 포함)
//     res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
//   }
// );

// 로그아웃
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: '로그아웃 실패' });
    }
    return res.json({ success: true, message: '로그아웃 성공' });
  });
});

// 현재 사용자 정보
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // 토큰에서 사용자 ID 추출
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: '액세스 토큰이 필요합니다' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // 사용자 정보 조회
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
        [decoded.userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    }) as any;

    if (!user) {
      return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다' });
    }

    return res.json({ 
      success: true, 
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'student',
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return res.status(500).json({ success: false, error: '서버 오류가 발생했습니다' });
  }
});

export default router; 