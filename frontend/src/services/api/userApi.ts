import { http } from '../http';
import type {
  ApiSuccess,
  PointListResult,
  QuestionListResult,
  UserAnswerListResult,
  UserProfile,
} from '../../types';

export interface MeListParams {
  page?: number;
  pageSize?: number;
}

export async function getMyProfileApi(): Promise<UserProfile> {
  const response = await http.get<ApiSuccess<{ profile: UserProfile }>>('/me');
  return response.data.data.profile;
}

export async function getMyQuestionsApi(
  params: MeListParams,
): Promise<QuestionListResult> {
  const response = await http.get<ApiSuccess<QuestionListResult>>('/me/questions', {
    params,
  });
  return response.data.data;
}

export async function getMyAnswersApi(
  params: MeListParams,
): Promise<UserAnswerListResult> {
  const response = await http.get<ApiSuccess<UserAnswerListResult>>('/me/answers', {
    params,
  });
  return response.data.data;
}

export async function getMyPointsApi(
  params: MeListParams,
): Promise<PointListResult> {
  const response = await http.get<ApiSuccess<PointListResult>>('/me/points', {
    params,
  });
  return response.data.data;
}
