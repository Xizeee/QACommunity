import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { AuthUser, UserRecord } from '../types/user';

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
  tokenExpiresIn: string;
}

const BCRYPT_ROUNDS = 10;

function toAuthUser(record: UserRecord): AuthUser {
  return {
    id: record.id,
    username: record.username,
    email: record.email,
    avatar: record.avatar,
    bio: record.bio,
    role: record.role,
    points: record.points,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// 并发注册同名用户时，数据库唯一约束是最终防线，这里把冲突错误转换为业务错误
function duplicateToApiError(error: unknown): ApiError {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('uk_users_username')) {
    return new ApiError(409, 'USERNAME_ALREADY_EXISTS', '用户名已被使用');
  }
  return new ApiError(409, 'EMAIL_ALREADY_EXISTS', '邮箱已被注册');
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthUser> {
    const [existingUsername, existingEmail] = await Promise.all([
      userRepository.findByUsername(input.username),
      userRepository.findByEmail(input.email),
    ]);
    if (existingUsername) {
      throw new ApiError(409, 'USERNAME_ALREADY_EXISTS', '用户名已被使用');
    }
    if (existingEmail) {
      throw new ApiError(409, 'EMAIL_ALREADY_EXISTS', '邮箱已被注册');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    let userId: number;
    try {
      userId = await userRepository.create({
        username: input.username,
        email: input.email,
        passwordHash,
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'ER_DUP_ENTRY') {
        throw duplicateToApiError(error);
      }
      throw error;
    }

    const created = await userRepository.findById(userId);
    if (!created) {
      throw new ApiError(500, 'INTERNAL_ERROR', '用户创建失败');
    }
    return toAuthUser(created);
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await userRepository.findByEmail(email);
    // 邮箱不存在与密码错误返回同一错误，避免泄露账号是否存在
    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', '邮箱或密码错误');
    }
    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', '邮箱或密码错误');
    }

    const token = jwt.sign({ sub: String(user.id) }, config.authSecret, {
      expiresIn: config.authExpiresIn as jwt.SignOptions['expiresIn'],
    });
    return { user: toAuthUser(user), token, tokenExpiresIn: config.authExpiresIn };
  },
};
