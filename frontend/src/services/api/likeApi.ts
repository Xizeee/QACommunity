import { http } from '../http';
import type { ApiSuccess, LikeResult, LikeTargetType } from '../../types';

export async function likeApi(
  targetType: LikeTargetType,
  targetId: number,
): Promise<LikeResult> {
  const response = await http.post<ApiSuccess<LikeResult>>('/likes', {
    targetType,
    targetId,
  });
  return response.data.data;
}

export async function unlikeApi(
  targetType: LikeTargetType,
  targetId: number,
): Promise<LikeResult> {
  const response = await http.delete<ApiSuccess<LikeResult>>('/likes', {
    data: { targetType, targetId },
  });
  return response.data.data;
}

export async function getLikedTargetIdsApi(
  targetType: LikeTargetType,
  targetIds: number[],
): Promise<number[]> {
  if (targetIds.length === 0) {
    return [];
  }
  const response = await http.get<ApiSuccess<{ likedTargetIds: number[] }>>(
    '/likes/status',
    { params: { targetType, targetIds: targetIds.join(',') } },
  );
  return response.data.data.likedTargetIds;
}
