import { PoolConnection, ResultSetHeader } from 'mysql2/promise';

export interface CreatePointTransactionData {
  userId: number;
  amount: number;
  type: string;
  referenceType: string | null;
  referenceId: number | null;
  idempotencyKey: string;
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
};
