import { http } from '../http';
import type { AnswerListResult, AnswerSummary, ApiSuccess } from '../../types';

export interface AnswerListParams {
  page?: number;
  pageSize?: number;
}

export async function getAnswersApi(
  questionId: number,
  params: AnswerListParams,
): Promise<AnswerListResult> {
  const response = await http.get<ApiSuccess<AnswerListResult>>(
    `/questions/${questionId}/answers`,
    { params },
  );
  return response.data.data;
}

export async function createAnswerApi(
  questionId: number,
  content: string,
): Promise<AnswerSummary> {
  const response = await http.post<ApiSuccess<{ answer: AnswerSummary }>>(
    `/questions/${questionId}/answers`,
    { content },
  );
  return response.data.data.answer;
}

export async function updateAnswerApi(
  answerId: number,
  content: string,
): Promise<AnswerSummary> {
  const response = await http.patch<ApiSuccess<{ answer: AnswerSummary }>>(
    `/answers/${answerId}`,
    { content },
  );
  return response.data.data.answer;
}

export async function deleteAnswerApi(answerId: number): Promise<void> {
  await http.delete(`/answers/${answerId}`);
}
