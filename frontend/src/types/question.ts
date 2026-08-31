export type QuestionStatus = 'UNSOLVED' | 'SOLVED' | 'DELETED';

export type QuestionSort = 'latest' | 'hot' | 'unsolved';

export interface TagBrief {
  id: number;
  name: string;
}

export interface TagWithCount extends TagBrief {
  questionCount: number;
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
  createdAt: string;
  updatedAt: string;
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

export interface QuestionContentPayload {
  title: string;
  content: string;
  tagIds: number[];
}
