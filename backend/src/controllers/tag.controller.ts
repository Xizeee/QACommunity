import { Request, Response } from 'express';
import { tagService } from '../services/tag.service';
import { asyncHandler } from '../utils/asyncHandler';

export const tagController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const tags = await tagService.listTags();
    res.json({ success: true, data: { tags } });
  }),
};
