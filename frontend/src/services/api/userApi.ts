import { http } from '../http';
import type {
  ApiSuccess,
  PointListResult,
  PublicUserProfile,
  QuestionListResult,
  UserAnswerListResult,
  UserProfile,
} from '../../types';

export interface MeListParams {
  page?: number;
  pageSize?: number;
}

export async function getUserProfileApi(userId: number): Promise<PublicUserProfile> {
  const response = await http.get<ApiSuccess<{ profile: PublicUserProfile }>>(
    `/users/${userId}`,
  );
  return response.data.data.profile;
}

export async function getUserQuestionsApi(
  userId: number,
  params: MeListParams,
): Promise<QuestionListResult> {
  const response = await http.get<ApiSuccess<QuestionListResult>>(
    `/users/${userId}/questions`,
    { params },
  );
  return response.data.data;
}

export async function getUserAnswersApi(
  userId: number,
  params: MeListParams,
): Promise<UserAnswerListResult> {
  const response = await http.get<ApiSuccess<UserAnswerListResult>>(
    `/users/${userId}/answers`,
    { params },
  );
  return response.data.data;
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
