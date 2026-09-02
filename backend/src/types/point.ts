import { Pagination } from './question';

// 积分流水展示（PRD 20.4）
export interface PointTransactionSummary {
  id: number;
  amount: number;
  type: string;
  createdAt: Date;
}

export interface PointListResult {
  currentPoints: number;
  items: PointTransactionSummary[];
  pagination: Pagination;
}
