import type { Pagination } from './question';

export interface PointTransactionSummary {
  id: number;
  amount: number;
  type: string;
  createdAt: string;
}

export interface PointListResult {
  currentPoints: number;
  items: PointTransactionSummary[];
  pagination: Pagination;
}
