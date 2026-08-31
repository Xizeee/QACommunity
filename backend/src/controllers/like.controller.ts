import { Request, Response } from 'express';
import { likeService } from '../services/like.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/user';

// 从逗号分隔的字符串解析目标 ID 列表（非法值由 service 层统一校验）
function parseTargetIds(value: unknown): number[] {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }
  return value.split(',').map((item) => Number(item));
}

export const likeController = {
  like: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await likeService.like(user.id, body.targetType, body.targetId);
    res.json({ success: true, data: result });
  }),

  unlike: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await likeService.unlike(user.id, body.targetType, body.targetId);
    res.json({ success: true, data: result });
  }),

  status: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const query = req.query as Record<string, unknown>;
    const targetIds = parseTargetIds(query.targetIds);
    const likedTargetIds = await likeService.getLikedTargetIds(
      user.id,
      query.targetType,
      targetIds,
    );
    res.json({ success: true, data: { likedTargetIds } });
  }),
};
