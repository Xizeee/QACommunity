import type { PoolConnection } from 'mysql2/promise';
import { pool } from '../config/database';
import { answerRepository } from '../repositories/answer.repository';
import { likeRepository } from '../repositories/like.repository';
import { questionRepository } from '../repositories/question.repository';
import { ApiError } from '../utils/apiError';
import { LikeTargetType } from '../types/like';

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

interface TargetLock {
  authorId: number;
  likeCount: number;
}

function assertTargetType(value: unknown): LikeTargetType {
  if (value !== 'QUESTION' && value !== 'ANSWER') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'targetType 只支持 QUESTION / ANSWER');
  }
  return value;
}

function assertTargetId(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'targetId 不合法');
  }
  return value;
}

// 锁定目标行并校验目标存在，返回作者与当前点赞数。
// 行锁串行化同一目标的并发点赞/取消，保证 like_count 不漂移（TECH_DESIGN 31）。
async function lockTarget(
  connection: PoolConnection,
  targetType: LikeTargetType,
  targetId: number,
): Promise<TargetLock> {
  if (targetType === 'QUESTION') {
    const record = await questionRepository.findByIdForUpdate(connection, targetId);
    if (!record || record.status === 'DELETED' || record.deletedAt) {
      throw new ApiError(404, 'QUESTION_NOT_FOUND', '问题不存在');
    }
    return { authorId: record.userId, likeCount: record.likeCount };
  }

  const record = await answerRepository.findByIdForUpdate(connection, targetId);
  if (!record || record.status === 'DELETED' || record.deletedAt) {
    throw new ApiError(404, 'ANSWER_NOT_FOUND', '回答不存在');
  }
  return { authorId: record.userId, likeCount: record.likeCount };
}

function incrementLikeCount(
  connection: PoolConnection,
  targetType: LikeTargetType,
  targetId: number,
): Promise<void> {
  return targetType === 'QUESTION'
    ? questionRepository.incrementLikeCount(connection, targetId)
    : answerRepository.incrementLikeCount(connection, targetId);
}

function decrementLikeCount(
  connection: PoolConnection,
  targetType: LikeTargetType,
  targetId: number,
): Promise<void> {
  return targetType === 'QUESTION'
    ? questionRepository.decrementLikeCount(connection, targetId)
    : answerRepository.decrementLikeCount(connection, targetId);
}

export const likeService = {
  // 点赞：幂等，同一用户对同一目标只会产生一条记录、一次计数
  async like(userId: number, targetType: unknown, targetId: unknown): Promise<LikeResult> {
    const type = assertTargetType(targetType);
    const id = assertTargetId(targetId);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const target = await lockTarget(connection, type, id);
      // PRD 14.3 / BR-005：不能给自己的内容点赞
      if (target.authorId === userId) {
        throw new ApiError(400, 'CANNOT_LIKE_OWN', '不能给自己的内容点赞');
      }

      const existing = await likeRepository.findByUserAndTarget(connection, userId, type, id);
      if (existing) {
        // 重复点赞：幂等返回当前状态，不重复计数
        await connection.commit();
        return { liked: true, likeCount: target.likeCount };
      }

      await likeRepository.create(connection, { userId, targetType: type, targetId: id });
      await incrementLikeCount(connection, type, id);
      await connection.commit();
      return { liked: true, likeCount: target.likeCount + 1 };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 取消点赞：幂等，未点赞时直接返回当前状态（TECH_DESIGN 34）
  async unlike(userId: number, targetType: unknown, targetId: unknown): Promise<LikeResult> {
    const type = assertTargetType(targetType);
    const id = assertTargetId(targetId);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const target = await lockTarget(connection, type, id);

      const removed = await likeRepository.remove(connection, userId, type, id);
      if (removed) {
        await decrementLikeCount(connection, type, id);
      }
      await connection.commit();
      return {
        liked: false,
        likeCount: removed ? Math.max(0, target.likeCount - 1) : target.likeCount,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 查询当前用户对一批目标的点赞状态（用于列表/详情展示）
  async getLikedTargetIds(
    userId: number,
    targetType: unknown,
    targetIds: number[],
  ): Promise<number[]> {
    const type = assertTargetType(targetType);
    const uniqueIds = [...new Set(targetIds)];
    if (uniqueIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'targetIds 不合法');
    }
    const liked = await likeRepository.findLikedTargetIds(userId, type, uniqueIds);
    return [...liked];
  },
};
