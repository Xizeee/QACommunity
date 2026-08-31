import { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { TagWithCount } from '../types/question';

interface TagRow extends RowDataPacket {
  id: number;
  name: string;
}

interface TagCountRow extends RowDataPacket {
  id: number;
  name: string;
  question_count: number;
}

export const tagRepository = {
  async listWithQuestionCount(): Promise<TagWithCount[]> {
    const [rows] = await pool.query<TagCountRow[]>(
      `SELECT t.id, t.name, COUNT(q.id) AS question_count
       FROM tags t
       LEFT JOIN question_tags qt ON qt.tag_id = t.id
       LEFT JOIN questions q ON q.id = qt.question_id AND q.deleted_at IS NULL
       GROUP BY t.id, t.name
       ORDER BY question_count DESC, t.id ASC`,
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      questionCount: row.question_count,
    }));
  },

  async findByIds(ids: number[]): Promise<TagRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await pool.query<TagRow[]>(
      `SELECT id, name FROM tags WHERE id IN (${placeholders})`,
      ids,
    );
    return rows;
  },

  async findNamesByQuestionIds(
    connection: PoolConnection | Pool,
    questionIds: number[],
  ): Promise<Map<number, { id: number; name: string }[]>> {
    const result = new Map<number, { id: number; name: string }[]>();
    if (questionIds.length === 0) {
      return result;
    }
    const placeholders = questionIds.map(() => '?').join(', ');
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT qt.question_id, t.id, t.name
       FROM question_tags qt
       JOIN tags t ON t.id = qt.tag_id
       WHERE qt.question_id IN (${placeholders})
       ORDER BY t.id ASC`,
      questionIds,
    );
    for (const row of rows as Array<{ question_id: number; id: number; name: string }>) {
      const list = result.get(row.question_id) ?? [];
      list.push({ id: row.id, name: row.name });
      result.set(row.question_id, list);
    }
    return result;
  },

  // 事务内重建问题与标签的关联
  async replaceQuestionTags(
    connection: PoolConnection,
    questionId: number,
    tagIds: number[],
  ): Promise<void> {
    await connection.execute(
      'DELETE FROM question_tags WHERE question_id = :questionId',
      { questionId },
    );
    for (const tagId of tagIds) {
      await connection.execute(
        'INSERT INTO question_tags (question_id, tag_id) VALUES (:questionId, :tagId)',
        { questionId, tagId },
      );
    }
  },
};
