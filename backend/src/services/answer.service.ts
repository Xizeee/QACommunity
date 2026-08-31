import { pool } from '../config/database';
import { answerRepository } from '../repositories/answer.repository';
import { questionRepository } from '../repositories/question.repository';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import { pointService } from './point.service';
import { AnswerListResult, AnswerSummary } from '../types/answer';

export const MAX_ANSWER_CONTENT_LENGTH = 50000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface AnswerListQueryInput {
  page?: string;
  pageSize?: string;
}

function assertValidId(id: number, label: string): void {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${label}不合法`);
  }
}

function parsePositiveInt(value: string | undefined, field: string): number {
  const parsed = Number(value);
  if (value === undefined || value === '' || !Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} 必须为正整数`);
  }
  return parsed;
}

async function loadAuthorMap(
  userIds: number[],
): Promise<Map<number, { id: number; username: string }>> {
  const users = await userRepository.findByIds([...new Set(userIds)]);
  return new Map(users.map((user) => [user.id, { id: user.id, username: user.username }]));
}

async function findActiveQuestion(questionId: number) {
  const question = await questionRepository.findById(questionId);
  if (!question || question.status === 'DELETED' || question.deletedAt) {
    throw new ApiError(404, 'QUESTION_NOT_FOUND', '问题不存在');
  }
  return question;
}

export const answerService = {
  async createAnswer(userId: number, questionId: number, content: string): Promise<AnswerSummary> {
    assertValidId(questionId, '问题 ID ');
    await findActiveQuestion(questionId);

    // 回答与问题 answer_count 统计必须处于同一事务（TECH_DESIGN 60）
    const connection = await pool.getConnection();
    let answerId = 0;
    try {
      await connection.beginTransaction();
      answerId = await answerRepository.create(connection, {
        questionId,
        userId,
        content,
      });
      await questionRepository.incrementAnswerCount(connection, questionId);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const created = await answerRepository.findById(answerId);
    const authorMap = await loadAuthorMap([userId]);
    return {
      id: created!.id,
      questionId: created!.questionId,
      content: created!.content,
      status: created!.status,
      likeCount: created!.likeCount,
      author: authorMap.get(userId)!,
      createdAt: created!.createdAt,
      updatedAt: created!.updatedAt,
    };
  },

  async listAnswers(
    questionId: number,
    query: AnswerListQueryInput,
  ): Promise<AnswerListResult> {
    assertValidId(questionId, '问题 ID ');
    await findActiveQuestion(questionId);

    const page = parsePositiveInt(query.page ?? '1', 'page');
    const pageSize = parsePositiveInt(
      query.pageSize ?? String(DEFAULT_PAGE_SIZE),
      'pageSize',
    );
    if (pageSize > MAX_PAGE_SIZE) {
      throw new ApiError(400, 'VALIDATION_ERROR', `pageSize 最大为 ${MAX_PAGE_SIZE}`);
    }

    const { ids, total } = await answerRepository.listByQuestionId(questionId, page, pageSize);
    const records = await answerRepository.findByIds(ids);
    const ordered = ids
      .map((id) => records.find((record) => record.id === id))
      .filter((record): record is NonNullable<typeof record> => Boolean(record));

    const authorMap = await loadAuthorMap(ordered.map((record) => record.userId));
    const items: AnswerSummary[] = ordered.map((record) => ({
      id: record.id,
      questionId: record.questionId,
      content: record.content,
      status: record.status,
      likeCount: record.likeCount,
      author: authorMap.get(record.userId) ?? { id: record.userId, username: '未知用户' },
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    return { items, pagination: { page, pageSize, total } };
  },

  async updateAnswer(userId: number, answerId: number, content: string): Promise<AnswerSummary> {
    assertValidId(answerId, '回答 ID ');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const record = await answerRepository.findByIdForUpdate(connection, answerId);
      if (!record || record.status === 'DELETED' || record.deletedAt) {
        throw new ApiError(404, 'ANSWER_NOT_FOUND', '回答不存在');
      }
      if (record.userId !== userId) {
        throw new ApiError(403, 'FORBIDDEN', '只能编辑自己的回答');
      }
      await answerRepository.update(connection, answerId, content);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const updated = await answerRepository.findById(answerId);
    const authorMap = await loadAuthorMap([updated!.userId]);
    return {
      id: updated!.id,
      questionId: updated!.questionId,
      content: updated!.content,
      status: updated!.status,
      likeCount: updated!.likeCount,
      author: authorMap.get(updated!.userId) ?? { id: updated!.userId, username: '未知用户' },
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
    };
  },

  async deleteAnswer(userId: number, answerId: number): Promise<void> {
    assertValidId(answerId, '回答 ID ');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const record = await answerRepository.findByIdForUpdate(connection, answerId);
      if (!record || record.status === 'DELETED' || record.deletedAt) {
        throw new ApiError(404, 'ANSWER_NOT_FOUND', '回答不存在');
      }
      if (record.userId !== userId) {
        throw new ApiError(403, 'FORBIDDEN', '只能删除自己的回答');
      }
      // PRD 12.4：已采纳的答案禁止删除
      if (record.status === 'ACCEPTED') {
        throw new ApiError(400, 'ANSWER_ALREADY_ACCEPTED', '该回答已被采纳，无法删除');
      }
      await answerRepository.softDelete(connection, answerId);
      // 删除后不再计入问题回答数量
      await questionRepository.decrementAnswerCount(connection, record.questionId);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // 采纳答案：仅提问者可采纳，一个问题最多一个采纳答案（PRD 13 / BR-003/004/007/008）
  async acceptAnswer(userId: number, questionId: number, answerId: unknown): Promise<AnswerSummary> {
    assertValidId(questionId, '问题 ID ');
    if (typeof answerId !== 'number' || !Number.isInteger(answerId) || answerId <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', '回答 ID 不合法');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // 先锁回答、再锁问题，与删除回答的加锁顺序一致，避免死锁；
      // 问题行锁同时串行化并发采纳，保证一个问题最多一个采纳答案（DATABASE_DESIGN 22）。
      const answer = await answerRepository.findByIdForUpdate(connection, answerId);
      if (!answer || answer.status === 'DELETED' || answer.deletedAt) {
        throw new ApiError(404, 'ANSWER_NOT_FOUND', '回答不存在');
      }
      const question = await questionRepository.findByIdForUpdate(connection, questionId);
      if (!question || question.status === 'DELETED' || question.deletedAt) {
        throw new ApiError(404, 'QUESTION_NOT_FOUND', '问题不存在');
      }
      if (question.userId !== userId) {
        throw new ApiError(403, 'FORBIDDEN', '只有提问者可以采纳答案');
      }
      if (answer.questionId !== questionId) {
        throw new ApiError(400, 'INVALID_ANSWER', '该回答不属于此问题');
      }

      if (question.acceptedAnswerId === null) {
        // 首次采纳：更新状态 + 发放采纳积分（同一事务）
        await answerRepository.accept(connection, answerId);
        await questionRepository.acceptAnswer(connection, questionId, answerId);
        await pointService.awardAnswerAccepted(connection, answer.userId, answerId);
      } else if (question.acceptedAnswerId !== answerId) {
        // PRD 13.3 / BR-008：采纳后不可更换答案
        throw new ApiError(400, 'QUESTION_ALREADY_SOLVED', '该问题已采纳答案，不能更换');
      }
      // 已采纳同一答案：幂等成功，不重复发放积分
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const accepted = await answerRepository.findById(answerId);
    const authorMap = await loadAuthorMap([accepted!.userId]);
    return {
      id: accepted!.id,
      questionId: accepted!.questionId,
      content: accepted!.content,
      status: accepted!.status,
      likeCount: accepted!.likeCount,
      author: authorMap.get(accepted!.userId) ?? { id: accepted!.userId, username: '未知用户' },
      createdAt: accepted!.createdAt,
      updatedAt: accepted!.updatedAt,
    };
  },
};
