import { pool } from '../config/database';
import { questionRepository } from '../repositories/question.repository';
import { tagRepository } from '../repositories/tag.repository';
import { userRepository } from '../repositories/user.repository';
import { ApiError } from '../utils/apiError';
import {
  Pagination,
  QuestionDetail,
  QuestionListResult,
  QuestionSort,
  QuestionStatus,
  QuestionSummary,
} from '../types/question';

export const MIN_TAGS = 1;
export const MAX_TAGS = 5;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface QuestionContentInput {
  title: string;
  content: string;
  tagIds: number[];
}

export interface ListQueryInput {
  page?: string;
  pageSize?: string;
  sort?: string;
  tag?: string;
}

interface QuestionBase {
  id: number;
  userId: number;
  title: string;
  status: QuestionStatus;
  viewCount: number;
  likeCount: number;
  answerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function toSummary(
  record: QuestionBase,
  author: { id: number; username: string } | undefined,
  tags: { id: number; name: string }[],
): QuestionSummary {
  return {
    id: record.id,
    title: record.title,
    status: record.status,
    viewCount: record.viewCount,
    likeCount: record.likeCount,
    answerCount: record.answerCount,
    tags,
    author: author ?? { id: 0, username: '未知用户' },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function loadRelations(records: QuestionBase[]): Promise<{
  tagMap: Map<number, { id: number; name: string }[]>;
  authorMap: Map<number, { id: number; username: string }>;
}> {
  const [tagMap, authors] = await Promise.all([
    tagRepository.findNamesByQuestionIds(pool, records.map((record) => record.id)),
    userRepository.findByIds([...new Set(records.map((record) => record.userId))]),
  ]);
  const authorMap = new Map(
    authors.map((author) => [author.id, { id: author.id, username: author.username }]),
  );
  return { tagMap, authorMap };
}

export const questionService = {
  async createQuestion(userId: number, input: QuestionContentInput): Promise<QuestionDetail> {
    const tagIds = await validateTagIds(input.tagIds);

    // 问题与标签关联必须处于同一事务，保证 question_tags 不出现悬挂数据
    const connection = await pool.getConnection();
    let questionId = 0;
    try {
      await connection.beginTransaction();
      questionId = await questionRepository.create(connection, {
        userId,
        title: input.title,
        content: input.content,
      });
      await tagRepository.replaceQuestionTags(connection, questionId, tagIds);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getQuestion(questionId, false);
  },

  async getQuestion(id: number, incrementView: boolean): Promise<QuestionDetail> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', '问题 ID 不合法');
    }
    if (incrementView) {
      await questionRepository.incrementViewCount(id);
    }
    const record = await questionRepository.findById(id);
    // 已删除问题对普通访问等同于不存在
    if (!record || record.status === 'DELETED' || record.deletedAt) {
      throw new ApiError(404, 'QUESTION_NOT_FOUND', '问题不存在');
    }
    const { tagMap, authorMap } = await loadRelations([record]);
    const summary = toSummary(record, authorMap.get(record.userId), tagMap.get(record.id) ?? []);
    return { ...summary, content: record.content };
  },

  async listQuestions(query: ListQueryInput): Promise<QuestionListResult> {
    const page = parsePositiveInt(query.page ?? '1', 'page');
    const pageSize = parsePositiveInt(query.pageSize ?? String(DEFAULT_PAGE_SIZE), 'pageSize');
    if (pageSize > MAX_PAGE_SIZE) {
      throw new ApiError(400, 'VALIDATION_ERROR', `pageSize 最大为 ${MAX_PAGE_SIZE}`);
    }
    const sort = (query.sort ?? 'latest') as QuestionSort;
    if (!['latest', 'hot', 'unsolved'].includes(sort)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'sort 只支持 latest / hot / unsolved');
    }
    const tagName = query.tag?.trim() || null;

    const { ids, total } = await questionRepository.list({ page, pageSize, sort, tagName });
    const records = await questionRepository.findByIds(ids);
    // 保持 SQL 排序顺序（热门排序无法在内存中重算）
    const ordered = ids
      .map((id) => records.find((record) => record.id === id))
      .filter((record): record is NonNullable<typeof record> => Boolean(record));

    const { tagMap, authorMap } = await loadRelations(ordered);
    const items = ordered.map((record) =>
      toSummary(record, authorMap.get(record.userId), tagMap.get(record.id) ?? []),
    );

    const pagination: Pagination = { page, pageSize, total };
    return { items, pagination };
  },

  async updateQuestion(
    userId: number,
    questionId: number,
    input: QuestionContentInput,
  ): Promise<QuestionDetail> {
    const tagIds = await validateTagIds(input.tagIds);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // 行锁防止并发编辑/删除同一问题
      const record = await questionRepository.findByIdForUpdate(connection, questionId);
      if (!record || record.status === 'DELETED' || record.deletedAt) {
        throw new ApiError(404, 'QUESTION_NOT_FOUND', '问题不存在');
      }
      if (record.userId !== userId) {
        throw new ApiError(403, 'FORBIDDEN', '只能编辑自己的问题');
      }
      await questionRepository.update(connection, questionId, {
        title: input.title,
        content: input.content,
      });
      await tagRepository.replaceQuestionTags(connection, questionId, tagIds);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getQuestion(questionId, false);
  },

  async deleteQuestion(userId: number, questionId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const record = await questionRepository.findByIdForUpdate(connection, questionId);
      if (!record || record.status === 'DELETED' || record.deletedAt) {
        throw new ApiError(404, 'QUESTION_NOT_FOUND', '问题不存在');
      }
      if (record.userId !== userId) {
        throw new ApiError(403, 'FORBIDDEN', '只能删除自己的问题');
      }
      await questionRepository.softDelete(connection, questionId);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

async function validateTagIds(tagIds: number[]): Promise<number[]> {
  const unique = [...new Set(tagIds)];
  if (unique.length < MIN_TAGS || unique.length > MAX_TAGS) {
    throw new ApiError(400, 'VALIDATION_ERROR', `标签数量必须为 ${MIN_TAGS}～${MAX_TAGS} 个`);
  }
  if (unique.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new ApiError(400, 'VALIDATION_ERROR', '标签 ID 不合法');
  }
  const found = await tagRepository.findByIds(unique);
  if (found.length !== unique.length) {
    throw new ApiError(400, 'INVALID_TAG', '包含不存在的标签');
  }
  return unique;
}

function parsePositiveInt(value: string | undefined, field: string): number {
  const parsed = Number(value);
  if (value === undefined || value === '' || !Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${field} 必须为正整数`);
  }
  return parsed;
}
