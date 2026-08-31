import type { PoolConnection } from 'mysql2/promise';
import { pointRepository } from '../repositories/point.repository';
import { userRepository } from '../repositories/user.repository';
import {
  ANSWER_ACCEPTED_POINTS,
  POINT_EVENT_ANSWER_ACCEPTED,
} from '../constants/points';

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
};
