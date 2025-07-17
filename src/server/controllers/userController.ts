import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  getUserList as getUserListService,
  getUserByEmail,
  getUserById,
  getUserByProvider,
  isEmailExists,
  createUser,
  updateUser,
  verifyPassword,
  updateLastLogin,
  logLoginHistory,
  createEmailVerificationToken,
  verifyEmailToken,
  createPasswordResetToken,
  resetPassword as resetPasswordService,
  deleteUser,
  toggleUserActive,
  User,
  CreateUserData
} from '../services/userService';

/**
 * 사용자 목록 조회
 */
export const getUserList = async (req: Request, res: Response) => {
  try {
    const users = await getUserListService();
    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    return res.status(500).json({ success: false, error: '사용자 목록 조회에 실패했습니다.' });
  }
};

/**
 * 회원가입
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'student' } = req.body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: '이메일, 비밀번호, 이름은 필수입니다.' 
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: '유효한 이메일 주소를 입력해주세요.' 
      });
    }

    // 비밀번호 강도 검증
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: '비밀번호는 최소 6자 이상이어야 합니다.' 
      });
    }

    // 기존 사용자 확인
    console.log(`🔍 회원가입 시도: ${email}`);
    const emailExists = await isEmailExists(email);
    console.log(`📊 이메일 존재 여부: ${email} -> ${emailExists}`);
    if (emailExists) {
      console.log(`❌ 이미 존재하는 이메일: ${email}`);
      return res.status(400).json({ 
        success: false, 
        error: '이미 등록된 이메일입니다.' 
      });
    }

    // 사용자 생성
    const userData: CreateUserData = {
      email,
      password,
      name,
      provider: 'local'
    };

    const newUser = await createUser(userData);

    // 이메일 인증 토큰 생성 (실제로는 이메일 발송)
    const verificationToken = await createEmailVerificationToken(newUser.id, email);

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다. 이메일 인증을 완료해주세요.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          is_verified: newUser.is_verified
        },
        token
      }
    });
  } catch (error) {
    console.error('회원가입 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '회원가입 중 오류가 발생했습니다.' 
    });
  }
};

/**
 * 로그인
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '이메일과 비밀번호를 입력해주세요.' 
      });
    }

    // 사용자 조회
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: '이메일 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    // 계정 활성화 확인
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false, 
        error: '비활성화된 계정입니다.' 
      });
    }

    // local provider가 아닌 경우 비밀번호 검증 불가
    if (user.provider !== 'local') {
      return res.status(401).json({ 
        success: false, 
        error: '소셜 로그인 계정입니다. 소셜 로그인을 이용해주세요.' 
      });
    }

    // 비밀번호가 없는 경우 (소셜 로그인 계정)
    if (!user.password) {
      return res.status(401).json({ 
        success: false, 
        error: '비밀번호가 설정되지 않은 계정입니다.' 
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // 로그인 실패 기록
      await logLoginHistory(
        user.id,
        'local',
        req.ip || '',
        req.get('User-Agent') || '',
        false
      );
      return res.status(401).json({ 
        success: false, 
        error: '이메일 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    // 마지막 로그인 시간 업데이트
    await updateLastLogin(user.id);

    // 로그인 성공 기록
    await logLoginHistory(user.id, 'local', req.ip || 'unknown', req.get('User-Agent') || 'unknown', true);

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
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_verified: user.is_verified
        },
        token
      }
    });
  } catch (error) {
    console.error('로그인 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: `로그인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    });
  }
};

/**
 * 프로필 조회
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ 
        success: false, 
        error: '인증이 필요합니다.' 
      });
    }

    const user = await getUserById(userId as string);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: '사용자를 찾을 수 없습니다.' 
      });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        provider: user.provider,
        is_verified: user.is_verified,
        last_login_at: user.last_login_at,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('프로필 조회 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '프로필 조회에 실패했습니다.' 
    });
  }
};

/**
 * 프로필 업데이트
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증이 필요합니다.' 
      });
    }

    const { name, avatar_url } = req.body;
    const updateData: Partial<User> = {};
    if (name) updateData.name = name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    await updateUser(userId as string, updateData);

    return res.json({
      success: true,
      message: '프로필이 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('프로필 업데이트 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '프로필 업데이트에 실패했습니다.' 
    });
  }
};

/**
 * 이메일 인증
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: '인증 토큰이 필요합니다.' 
      });
    }

    const user = await verifyEmailToken(token);
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: '유효하지 않은 인증 토큰입니다.' 
      });
    }

    return res.json({
      success: true,
      message: '이메일 인증이 완료되었습니다.'
    });
  } catch (error) {
    console.error('이메일 인증 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '이메일 인증에 실패했습니다.' 
    });
  }
};

/**
 * 비밀번호 재설정 요청
 */
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: '이메일을 입력해주세요.' 
      });
    }

    const token = await createPasswordResetToken(email);
    if (!token) {
      return res.status(404).json({ 
        success: false, 
        error: '등록되지 않은 이메일입니다.' 
      });
    }

    // 실제로는 이메일 발송 로직 추가
    console.log('비밀번호 재설정 토큰:', token);

    return res.json({
      success: true,
      message: '비밀번호 재설정 이메일이 발송되었습니다.'
    });
  } catch (error) {
    console.error('비밀번호재설정 요청 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '비밀번호 재설정 요청에 실패했습니다.' 
    });
  }
};

/**
 * 비밀번호 재설정
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: '토큰과 새 비밀번호를 입력해주세요.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: '비밀번호는 최소 6자 이상이어야 합니다.' 
      });
    }

    const success = await resetPasswordService(token, newPassword);
    if (!success) {
      return res.status(400).json({ 
        success: false, 
        error: '유효하지 않은 토큰이거나 만료되었습니다.' 
      });
    }

    return res.json({
      success: true,
      message: '비밀번호가 재설정되었습니다.'
    });
  } catch (error) {
    console.error('비밀번호 재설정 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '비밀번호 재설정에 실패했습니다.' 
    });
  }
};

/**
 * 회원 탈퇴
 */
export const withdrawUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: '인증이 필요합니다.' 
      });
    }

    await deleteUser(userId as string);

    return res.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.'
    });
  } catch (error) {
    console.error('회원 탈퇴 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '회원 탈퇴에 실패했습니다.' 
    });
  }
};

/**
 * 계정 활성화/비활성화 (관리자용)
 */
export const toggleUserActiveStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: '활성화 상태를 지정해주세요.' 
      });
    }

    await toggleUserActive(userId as string, isActive);

    return res.json({
      success: true,
      message: `계정이 ${isActive ? '활성화' : '비활성화'}되었습니다.`
    });
  } catch (error) {
    console.error('계정 상태 변경 실패:', error);
    return res.status(500).json({ 
      success: false, 
      error: '계정 상태 변경에 실패했습니다.' 
    });
  }
}; 