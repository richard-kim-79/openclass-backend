export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  provider: string;
  provider_id: string;
  is_active: number;
  is_verified: number;
  created_at: string;
  updated_at: string;
}

// Express Request에 User 타입을 확장
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      provider: string;
      provider_id: string;
      is_active: number;
      is_verified: number;
      created_at: string;
      updated_at: string;
    }
  }
} 