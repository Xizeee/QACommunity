import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { UserProfile } from '../types/user';

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
};
