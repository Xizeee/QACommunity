import { http } from '../http';
import type {
  ApiSuccess,
  QuestionContentPayload,
  QuestionDetail,
  QuestionListResult,
  QuestionSort,
} from '../../types';

export interface QuestionListParams {
  page?: number;
  pageSize?: number;
  sort?: QuestionSort;
  tag?: string;
  keyword?: string;
}

export async function getQuestionsApi(
  params: QuestionListParams,
): Promise<QuestionListResult> {
  const response = await http.get<ApiSuccess<QuestionListResult>>('/questions', {
    params,
  });
  return response.data.data;
}

export async function getQuestionApi(id: number): Promise<QuestionDetail> {
  const response = await http.get<ApiSuccess<{ question: QuestionDetail }>>(
    `/questions/${id}`,
  );
  return response.data.data.question;
}

export async function createQuestionApi(
  payload: QuestionContentPayload,
): Promise<QuestionDetail> {
  const response = await http.post<ApiSuccess<{ question: QuestionDetail }>>(
    '/questions',
    payload,
  );
  return response.data.data.question;
}

export async function updateQuestionApi(
  id: number,
  payload: QuestionContentPayload,
): Promise<QuestionDetail> {
  const response = await http.patch<ApiSuccess<{ question: QuestionDetail }>>(
    `/questions/${id}`,
    payload,
  );
  return response.data.data.question;
}

export async function deleteQuestionApi(id: number): Promise<void> {
  await http.delete(`/questions/${id}`);
}
