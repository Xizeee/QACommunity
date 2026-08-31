export type QuestionStatus = 'UNSOLVED' | 'SOLVED' | 'DELETED';

export type QuestionSort = 'latest' | 'hot' | 'unsolved';

export interface QuestionRecord {
  id: number;
  userId: number;
  title: string;
  content: string;
  status: QuestionStatus;
  viewCount: number;
  likeCount: number;
  answerCount: number;
  acceptedAnswerId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TagBrief {
  id: number;
  name: string;
}

export interface QuestionAuthor {
  id: number;
  username: string;
}

export interface QuestionSummary {
  id: number;
  title: string;
  status: QuestionStatus;
  viewCount: number;
  likeCount: number;
  answerCount: number;
  tags: TagBrief[];
  author: QuestionAuthor;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionDetail extends QuestionSummary {
  content: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface QuestionListResult {
  items: QuestionSummary[];
  pagination: Pagination;
}

export interface TagWithCount {
  id: number;
  name: string;
  questionCount: number;
}
