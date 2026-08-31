import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { AnswerRecord, AnswerStatus } from '../types/answer';

interface AnswerRow extends RowDataPacket {
  id: number;
  question_id: number;
  user_id: number;
  content: string;
  status: AnswerStatus;
  like_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

function toRecord(row: AnswerRow): AnswerRecord {
  return {
    id: row.id,
    questionId: row.question_id,
    userId: row.user_id,
    content: row.content,
    status: row.status,
    likeCount: row.like_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

const SELECT_COLUMNS = `id, question_id, user_id, content, status, like_count, created_at, updated_at, deleted_at`;

export interface CreateAnswerData {
  questionId: number;
  userId: number;
  content: string;
}

export const answerRepository = {
  // PRD 11.3：已采纳优先 → 点赞数降序 → 发布时间升序；默认排除已删除
  async listByQuestionId(
    questionId: number,
    page: number,
    pageSize: number,
  ): Promise<{ ids: number[]; total: number }> {
    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM answers WHERE question_id = :questionId AND deleted_at IS NULL',
      { questionId },
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM answers
       WHERE question_id = :questionId AND deleted_at IS NULL
       ORDER BY (status = 'ACCEPTED') DESC, like_count DESC, created_at ASC, id ASC
       LIMIT :limit OFFSET :offset`,
      { questionId, limit: pageSize, offset: (page - 1) * pageSize },
    );
    return { ids: rows.map((row) => Number(row.id)), total };
  },

  async findByIds(ids: number[]): Promise<AnswerRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await pool.query<AnswerRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM answers WHERE id IN (${placeholders})`,
      ids,
    );
    return rows.map(toRecord);
  },

  async findById(id: number): Promise<AnswerRecord | null> {
    const [rows] = await pool.query<AnswerRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM answers WHERE id = :id`,
      { id },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  // 事务内锁定回答行，防止并发编辑/删除
  async findByIdForUpdate(
    connection: PoolConnection,
    id: number,
  ): Promise<AnswerRecord | null> {
    const [rows] = await connection.query<AnswerRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM answers WHERE id = :id FOR UPDATE`,
      { id },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  async create(connection: PoolConnection, data: CreateAnswerData): Promise<number> {
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO answers (question_id, user_id, content) VALUES (:questionId, :userId, :content)',
      {
        questionId: data.questionId,
        userId: data.userId,
        content: data.content,
      },
    );
    return result.insertId;
  },

  async update(
    connection: PoolConnection,
    id: number,
    content: string,
  ): Promise<void> {
    await connection.execute(
      'UPDATE answers SET content = :content WHERE id = :id',
      { content, id },
    );
  },

  async softDelete(connection: PoolConnection, id: number): Promise<void> {
    await connection.execute(
      "UPDATE answers SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP WHERE id = :id",
      { id },
    );
  },

  // 采纳答案：将回答标记为已采纳（PRD 13.2）
  async accept(connection: PoolConnection, id: number): Promise<void> {
    await connection.execute(
      "UPDATE answers SET status = 'ACCEPTED' WHERE id = :id",
      { id },
    );
  },

  // 点赞/取消点赞时维护 like_count 统计，需在点赞事务内调用
  async incrementLikeCount(connection: PoolConnection, id: number): Promise<void> {
    await connection.execute(
      'UPDATE answers SET like_count = like_count + 1 WHERE id = :id',
      { id },
    );
  },

  async decrementLikeCount(connection: PoolConnection, id: number): Promise<void> {
    await connection.execute(
      'UPDATE answers SET like_count = GREATEST(like_count - 1, 0) WHERE id = :id',
      { id },
    );
  },
};
