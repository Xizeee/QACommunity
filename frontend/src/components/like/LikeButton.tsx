import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { likeApi, unlikeApi } from '../../services/api/likeApi';
import { ApiClientError } from '../../services/http';
import { useAuthStore } from '../../stores/authStore';
import type { LikeTargetType } from '../../types';

interface LikeButtonProps {
  targetType: LikeTargetType;
  targetId: number;
  likeCount: number;
  liked: boolean;
  disabled?: boolean;
}

export function LikeButton({
  targetType,
  targetId,
  likeCount,
  liked,
  disabled = false,
}: LikeButtonProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isLiked, setIsLiked] = useState(liked);
  const [count, setCount] = useState(likeCount);
  const [busy, setBusy] = useState(false);

  // 外部状态变化（如刷新后重新加载）时同步本地状态
  useEffect(() => {
    setIsLiked(liked);
    setCount(likeCount);
  }, [liked, likeCount]);

  const handleClick = async () => {
    if (busy || disabled) {
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    setBusy(true);
    try {
      const next = isLiked
        ? await unlikeApi(targetType, targetId)
        : await likeApi(targetType, targetId);
      setIsLiked(next.liked);
      setCount(next.likeCount);
    } catch (error) {
      // 登录态失效时引导重新登录，其余错误保持原状态
      if (error instanceof ApiClientError && error.status === 401) {
        navigate('/login');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={isLiked ? 'like-button liked' : 'like-button'}
      onClick={handleClick}
      disabled={busy || disabled}
      title={disabled ? '不能给自己的内容点赞' : isLiked ? '取消点赞' : '点赞'}
    >
      👍 {count}
    </button>
  );
}
