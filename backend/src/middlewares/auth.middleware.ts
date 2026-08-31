import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler';

export interface JwtPayload {
  sub: string;
}

// 受保护接口的认证入口：解析 Bearer Token 并加载当前用户
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'AUTH_REQUIRED', '请先登录');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(header.slice(7), config.authSecret) as JwtPayload;
    } catch {
      throw new ApiError(401, 'AUTH_REQUIRED', '登录状态已失效');
    }

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ApiError(401, 'AUTH_REQUIRED', '登录状态已失效');
    }

    const record = await userRepository.findById(userId);
    if (!record) {
      throw new ApiError(401, 'AUTH_REQUIRED', '登录状态已失效');
    }

    req.user = {
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
    next();
  },
);
