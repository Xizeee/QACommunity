import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { PointTransactionSummary } from '../types/point';

export interface CreatePointTransactionData {
  userId: number;
  amount: number;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  idempotencyKey: string;
}

interface PointTransactionRow extends RowDataPacket {
  id: number;
  amount: number;
  type: string;
  created_at: Date;
}

export const pointRepository = {
  // 在调用方事务内创建积分流水；幂等由 idempotency_key 唯一索引兜底
  async create(
    connection: PoolConnection,
    data: CreatePointTransactionData,
  ): Promise<number> {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO point_transactions
         (user_id, amount, type, reference_type, reference_id, idempotency_key)
       VALUES (:userId, :amount, :type, :referenceType, :referenceId, :idempotencyKey)`,
      {
        userId: data.userId,
        amount: data.amount,
        type: data.type,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        idempotencyKey: data.idempotencyKey,
      },
    );
    return result.insertId;
  },

  // 按用户分页列出积分流水（我的积分，PRD 20.4）
  async listByUserId(
    userId: number,
    page: number,
    pageSize: number,
  ): Promise<{ items: PointTransactionSummary[]; total: number }> {
    const [countRows] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM point_transactions WHERE user_id = :userId',
      { userId },
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query<PointTransactionRow[]>(
      `SELECT id, amount, type, created_at FROM point_transactions
       WHERE user_id = :userId
       ORDER BY created_at DESC, id DESC
       LIMIT :limit OFFSET :offset`,
      { userId, limit: pageSize, offset: (page - 1) * pageSize },
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        amount: row.amount,
        type: row.type,
        createdAt: row.created_at,
      })),
      total,
    };
  },
};
