import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { LikeRecord, LikeTargetType } from '../types/like';

interface LikeRow extends RowDataPacket {
  id: number;
  user_id: number;
  target_type: LikeTargetType;
  target_id: number;
  created_at: Date;
}

function toRecord(row: LikeRow): LikeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    targetType: row.target_type,
    targetId: row.target_id,
    createdAt: row.created_at,
  };
}

export interface CreateLikeData {
  userId: number;
  targetType: LikeTargetType;
  targetId: number;
}

export const likeRepository = {
  // 在事务内查询点赞关系是否存在（唯一索引是最终防线，这里只做幂等判断）
  async findByUserAndTarget(
    connection: PoolConnection,
    userId: number,
    targetType: LikeTargetType,
    targetId: number,
  ): Promise<LikeRecord | null> {
    const [rows] = await connection.query<LikeRow[]>(
      `SELECT id, user_id, target_type, target_id, created_at
       FROM likes
       WHERE user_id = :userId AND target_type = :targetType AND target_id = :targetId`,
      { userId, targetType, targetId },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  async create(connection: PoolConnection, data: CreateLikeData): Promise<number> {
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO likes (user_id, target_type, target_id) VALUES (:userId, :targetType, :targetId)',
      { userId: data.userId, targetType: data.targetType, targetId: data.targetId },
    );
    return result.insertId;
  },

  // 删除点赞关系，返回是否真正删除了记录
  async remove(
    connection: PoolConnection,
    userId: number,
    targetType: LikeTargetType,
    targetId: number,
  ): Promise<boolean> {
    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM likes WHERE user_id = :userId AND target_type = :targetType AND target_id = :targetId',
      { userId, targetType, targetId },
    );
    return result.affectedRows > 0;
  },

  // 批量查询当前用户已点赞的目标集合，用于列表/详情状态展示
  async findLikedTargetIds(
    userId: number,
    targetType: LikeTargetType,
    targetIds: number[],
  ): Promise<Set<number>> {
    if (targetIds.length === 0) {
      return new Set();
    }
    const placeholders = targetIds.map(() => '?').join(', ');
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT target_id FROM likes
       WHERE user_id = ? AND target_type = ? AND target_id IN (${placeholders})`,
      [userId, targetType, ...targetIds],
    );
    return new Set(rows.map((row) => Number(row.target_id)));
  },
};
