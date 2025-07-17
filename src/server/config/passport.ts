import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from './database';
import { v4 as uuidv4 } from 'uuid';
import '../types/user'; // User 타입 확장을 위해 import

// 사용자 직렬화/역직렬화
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        return done(err);
      }
      done(null, user as any);
    });
  } catch (error) {
    done(error);
  }
});

// Google OAuth 전략
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // 기존 사용자 확인
    db.get('SELECT * FROM users WHERE provider = ? AND provider_id = ?', 
      ['google', profile.id], (err, existingUser) => {
      if (err) {
        return done(err);
      }
      
      if (existingUser) {
        return done(null, existingUser as any);
      }
      
      // 새 사용자 생성
      const userId = uuidv4();
      const now = new Date().toISOString();
      
      db.run(
        `INSERT INTO users (id, email, name, avatar_url, provider, provider_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          profile.emails?.[0]?.value || '',
          profile.displayName,
          profile.photos?.[0]?.value || null,
          'google',
          profile.id,
          now,
          now
        ],
        function(err) {
          if (err) {
            return done(err);
          }
          
          // 생성된 사용자 조회
          db.get('SELECT * FROM users WHERE id = ?', [userId], (err, newUser) => {
            if (err) {
              return done(err);
            }
            done(null, newUser as any);
          });
        }
      );
    });
  } catch (error) {
    done(error);
  }
}));

// Naver OAuth 전략
// passport.use(new NaverStrategy({
//   clientID: process.env.NAVER_CLIENT_ID || '',
//   clientSecret: process.env.NAVER_CLIENT_SECRET || '',
//   callbackURL: process.env.NAVER_CALLBACK_URL || 'http://localhost:3001/auth/naver/callback'
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     // 기존 사용자 확인
//     db.get('SELECT * FROM users WHERE provider = ? AND provider_id = ?', 
//       ['naver', profile.id], (err, existingUser) => {
//       if (err) {
//         return done(err);
//       }
      
//       if (existingUser) {
//         return done(null, existingUser);
//       }
      
//       // 새 사용자 생성
//       const userId = uuidv4();
//       const now = new Date().toISOString();
      
//       db.run(
//         `INSERT INTO users (id, email, name, avatar_url, provider, provider_id, created_at, updated_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           userId,
//           profile.emails?.[0]?.value || '',
//           profile.displayName,
//           profile.photos?.[0]?.value || null,
//           'naver',
//           profile.id,
//           now,
//           now
//         ],
//         function(err) {
//           if (err) {
//             return done(err);
//           }
          
//           // 생성된 사용자 조회
//           db.get('SELECT * FROM users WHERE id = ?', [userId], (err, newUser) => {
//             if (err) {
//               return done(err);
//             }
//             done(null, newUser);
//           });
//         }
//       );
//     });
//   } catch (error) {
//     done(error);
//   }
// }));

export default passport; 