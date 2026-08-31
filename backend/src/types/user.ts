export type UserRole = 'USER' | 'ADMIN';

// 数据库 users 行对应的完整记录，仅在后端内部使用
export interface UserRecord {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

// 对外暴露的用户信息，不包含密码哈希等敏感字段
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}
