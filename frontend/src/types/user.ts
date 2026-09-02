export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  questionCount: number;
  answerCount: number;
  likeCount: number;
}

// 公开用户主页：不包含邮箱等敏感字段（PRD 20.1）
export interface PublicUserProfile {
  id: number;
  username: string;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  points: number;
  questionCount: number;
  answerCount: number;
  likeCount: number;
}
