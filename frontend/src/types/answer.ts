export type AnswerStatus = 'NORMAL' | 'ACCEPTED' | 'DELETED';

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
  createdAt: string;
  updatedAt: string;
}

export interface AnswerListResult {
  items: AnswerSummary[];
  pagination: import('./question').Pagination;
}
