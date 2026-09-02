import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { PublicUserProfile, UserProfile } from '../types/user';

export const userService = {
  // 个人中心：基本信息 + 提问/回答/获赞统计（PRD 20.1）
  async getProfile(userId: number): Promise<UserProfile> {
    const record = await userRepository.findById(userId);
    if (!record) {
      throw new ApiError(404, 'USER_NOT_FOUND', '用户不存在');
    }
    const stats = await userRepository.getStats(userId);
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
      ...stats,
    };
  },

  // 公开用户主页：复用 getStats，但排除邮箱等敏感字段（PRD 20.1）
  async getPublicProfile(userId: number): Promise<PublicUserProfile> {
    const record = await userRepository.findById(userId);
    if (!record) {
      throw new ApiError(404, 'USER_NOT_FOUND', '用户不存在');
    }
    const stats = await userRepository.getStats(userId);
    return {
      id: record.id,
      username: record.username,
      avatar: record.avatar,
      bio: record.bio,
      role: record.role,
      points: record.points,
      ...stats,
    };
  },

  // 公开内容接口（/users/:id/questions 等）用户存在性校验：不存在时返回 404
  async assertExists(userId: number): Promise<void> {
    const record = await userRepository.findById(userId);
    if (!record) {
      throw new ApiError(404, 'USER_NOT_FOUND', '用户不存在');
    }
  },
};
