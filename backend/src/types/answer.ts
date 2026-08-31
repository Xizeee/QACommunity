export type AnswerStatus = 'NORMAL' | 'ACCEPTED' | 'DELETED';

export interface AnswerRecord {
  id: number;
  questionId: number;
  userId: number;
  content: string;
  status: AnswerStatus;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AnswerAuthor {
  id: number;
  username: string;
}

export interface AnswerSummary {
  id: number;
  questionId: number;
  content: string;
  status: AnswerStatus;
  likeCount: number;
  author: AnswerAuthor;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface AnswerListResult {
  items: AnswerSummary[];
  pagination: Pagination;
}
