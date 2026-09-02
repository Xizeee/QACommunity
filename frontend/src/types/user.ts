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
