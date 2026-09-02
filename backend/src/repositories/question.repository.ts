import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { QuestionRecord, QuestionSort, QuestionStatus } from '../types/question';

interface QuestionRow extends RowDataPacket {
  id: number;
  user_id: number;
  title: string;
  content: string;
  status: QuestionStatus;
  view_count: number;
  like_count: number;
  answer_count: number;
  accepted_answer_id: number | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface QuestionListOptions {
  page: number;
  pageSize: number;
  sort: QuestionSort;
  tagName: string | null;
  keyword: string | null;
}

export interface CreateQuestionData {
  userId: number;
  title: string;
  content: string;
}

export interface UpdateQuestionData {
  title: string;
  content: string;
}

function toRecord(row: QuestionRow): QuestionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    status: row.status,
    viewCount: row.view_count,
    likeCount: row.like_count,
    answerCount: row.answer_count,
    acceptedAnswerId: row.accepted_answer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const BASE_COLUMNS = `id, user_id, title, content, status, view_count, like_count, answer_count, accepted_answer_id, created_at, updated_at, deleted_at`;

// 转义 LIKE 通配符，保证关键词按字面量匹配（PRD 16.2：标题/内容/标签）
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

// 热门排序：互动分 × 新鲜度（48 小时半衰期）的数据库简化实现，
// 权重与衰减参数为 MVP 初始值，后续可按实际数据调整
const HOT_SCORE_SQL = `((q.like_count * 2 + q.answer_count * 3 + q.view_count * 0.1)
    * POW(0.5, TIMESTAMPDIFF(MINUTE, q.created_at, NOW()) / 2880.0))`;

const SORT_ORDERS: Record<QuestionSort, string> = {
  latest: 'q.created_at DESC, q.id DESC',
  hot: `${HOT_SCORE_SQL} DESC, q.created_at DESC`,
  unsolved: 'q.created_at DESC, q.id DESC',
};

export const questionRepository = {
  async list(options: QuestionListOptions): Promise<{ ids: number[]; total: number }> {
    const conditions = ['q.deleted_at IS NULL'];
    const params: Record<string, unknown> = {};
    if (options.sort === 'unsolved') {
      conditions.push("q.status = 'UNSOLVED'");
    }
    if (options.tagName) {
      conditions.push(
        'q.id IN (SELECT qt.question_id FROM question_tags qt JOIN tags t ON t.id = qt.tag_id WHERE t.name = :tagName)',
      );
      params.tagName = options.tagName;
    }
    if (options.keyword) {
      conditions.push(
        `(q.title LIKE :keywordLike OR q.content LIKE :keywordLike
          OR q.id IN (
            SELECT qt.question_id FROM question_tags qt JOIN tags t ON t.id = qt.tag_id
            WHERE t.name LIKE :keywordLike
          ))`,
      );
      params.keywordLike = `%${escapeLike(options.keyword)}%`;
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM questions q ${where}`,
      params as Record<string, string | number>,
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT q.id FROM questions q ${where}
       ORDER BY ${SORT_ORDERS[options.sort]}
       LIMIT :limit OFFSET :offset`,
      { ...params, limit: options.pageSize, offset: (options.page - 1) * options.pageSize },
    );
    return { ids: rows.map((row) => Number(row.id)), total };
  },

  // 按作者分页列出问题（我的提问，PRD 20.2）
  async listByUser(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<{ ids: number[]; total: number }> {
    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM questions WHERE user_id = :userId AND deleted_at IS NULL',
      { userId },
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM questions
       WHERE user_id = :userId AND deleted_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset: (page - 1) * pageSize },
    );
    return { ids: rows.map((row) => Number(row.id)), total };
  },

  async findByIds(ids: number[]): Promise<QuestionRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await pool.query<QuestionRow[]>(
      `SELECT ${BASE_COLUMNS} FROM questions WHERE id IN (${placeholders})`,
      ids,
    );
    return rows.map(toRecord);
  },

  async findById(id: number): Promise<QuestionRecord | null> {
    const [rows] = await pool.query<QuestionRow[]>(
      `SELECT ${BASE_COLUMNS} FROM questions WHERE id = :id`,
      { id },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  // 事务内按主键锁定问题行，防止并发修改（如同时编辑/删除）
  async findByIdForUpdate(
    connection: PoolConnection,
    id: number,
  ): Promise<QuestionRecord | null> {
    const [rows] = await connection.query<QuestionRow[]>(
      `SELECT ${BASE_COLUMNS} FROM questions WHERE id = :id FOR UPDATE`,
      { id },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  async create(connection: PoolConnection, data: CreateQuestionData): Promise<number> {
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO questions (user_id, title, content) VALUES (:userId, :title, :content)',
      {
        userId: data.userId,
        title: data.title,
        content: data.content,
      },
    );
    return result.insertId;
  },

  async update(
    connection: PoolConnection,
    id: number,
    data: UpdateQuestionData,
  ): Promise<void> {
    await connection.execute(
      'UPDATE questions SET title = :title, content = :content WHERE id = :id',
      { ...data, id },
    );
  },

  async softDelete(connection: PoolConnection, id: number): Promise<void> {
    await connection.execute(
      "UPDATE questions SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP WHERE id = :id",
      { id },
    );
  },

  // 采纳答案：记录 accepted_answer_id 并将问题标记为已解决（PRD 10.4 / BR-007）
  async acceptAnswer(
    connection: PoolConnection,
    id: number,
    answerId: number,
  ): Promise<void> {
    await connection.execute(
      "UPDATE questions SET accepted_answer_id = :answerId, status = 'SOLVED' WHERE id = :id",
      { answerId, id },
    );
  },

  async incrementViewCount(id: number): Promise<void> {
    await pool.execute('UPDATE questions SET view_count = view_count + 1 WHERE id = :id', {
      id,
    });
  },

  // 回答创建/删除时维护 answer_count 统计，需在回答事务内调用
  async incrementAnswerCount(
    connection: PoolConnection,
    id: number,
  ): Promise<void> {
    await connection.execute(
      'UPDATE questions SET answer_count = answer_count + 1 WHERE id = :id',
      { id },
    );
  },

  async decrementAnswerCount(
    connection: PoolConnection,
    id: number,
  ): Promise<void> {
    await connection.execute(
      'UPDATE questions SET answer_count = GREATEST(answer_count - 1, 0) WHERE id = :id',
      { id },
    );
  },

  // 点赞/取消点赞时维护 like_count 统计，需在点赞事务内调用
  async incrementLikeCount(connection: PoolConnection, id: number): Promise<void> {
    await connection.execute(
      'UPDATE questions SET like_count = like_count + 1 WHERE id = :id',
      { id },
    );
  },

  async decrementLikeCount(connection: PoolConnection, id: number): Promise<void> {
    await connection.execute(
      'UPDATE questions SET like_count = GREATEST(like_count - 1, 0) WHERE id = :id',
      { id },
    );
  },
};
