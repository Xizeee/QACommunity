import { useEffect, useState } from 'react';
import { getLikedTargetIdsApi } from '../services/api/likeApi';
import { useAuthStore } from '../stores/authStore';
import type { LikeTargetType } from '../types';

// 批量查询当前用户对一组目标的点赞状态，返回已点赞的目标 ID 集合。
// ids 需由调用方通过 useMemo 保证引用稳定，避免重复请求。
export function useLikedIds(targetType: LikeTargetType, ids: number[]): Set<number> {
  const user = useAuthStore((state) => state.user);
  const userId = user?.id ?? null;
  const [liked, setLiked] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    if (userId === null || ids.length === 0) {
      setLiked(new Set());
      return () => {
        active = false;
      };
    }
    getLikedTargetIdsApi(targetType, ids)
      .then((result) => {
        if (active) {
          setLiked(new Set(result));
        }
      })
      .catch(() => {
        if (active) {
          setLiked(new Set());
        }
      });
    return () => {
      active = false;
    };
  }, [targetType, ids, userId]);

  return liked;
}
