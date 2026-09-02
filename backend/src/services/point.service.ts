import type { PoolConnection } from 'mysql2/promise';
import { pointRepository } from '../repositories/point.repository';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { PointListResult } from '../types/point';
import {
  ANSWER_ACCEPTED_POINTS,
  POINT_EVENT_ANSWER_ACCEPTED,
} from '../constants/points';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | undefined, field: string): number {
  const parsed = Number(value);
  if (value === undefined || value === '' || !Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} 必须为正整数`);
  }
  return parsed;
}

export const pointService = {
  // 回答被采纳积分：创建流水 + 更新余额，必须在调用方事务内执行。
  // 重复发放由 point_transactions.idempotency_key 唯一索引兜底。
  async awardAnswerAccepted(
    connection: PoolConnection,
    answerAuthorId: number,
    answerId: number,
  ): Promise<void> {
    await pointRepository.create(connection, {
      userId: answerAuthorId,
      amount: ANSWER_ACCEPTED_POINTS,
      type: POINT_EVENT_ANSWER_ACCEPTED,
      referenceType: 'ANSWER',
      referenceId: answerId,
      idempotencyKey: `${POINT_EVENT_ANSWER_ACCEPTED}:${answerId}`,
    });
    await userRepository.incrementPoints(connection, answerAuthorId, ANSWER_ACCEPTED_POINTS);
  },

  // 我的积分：当前余额 + 分页流水（PRD 20.4）
  async listPointsByUser(
    userId: number,
    query: { page?: string; pageSize?: string },
  ): Promise<PointListResult> {
    const page = parsePositiveInt(query.page ?? '1', 'page');
    const pageSize = parsePositiveInt(query.pageSize ?? String(DEFAULT_PAGE_SIZE), 'pageSize');
    if (pageSize > MAX_PAGE_SIZE) {
      throw new ApiError(400, 'VALIDATION_ERROR', `pageSize 最大为 ${MAX_PAGE_SIZE}`);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', '用户不存在');
    }

    const { items, total } = await pointRepository.listByUserId(userId, page, pageSize);
    return { currentPoints: user.points, items, pagination: { page, pageSize, total } };
  },
};
