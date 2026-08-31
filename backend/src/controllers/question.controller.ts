import { Request, Response } from 'express';
import { questionService } from '../services/question.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/user';

function parseId(value: string): number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export const questionController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as Record<string, string | undefined>;
    const result = await questionService.listQuestions(query);
    res.json({ success: true, data: result });
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '问题 ID 不合法' },
      });
      return;
    }
    const question = await questionService.getQuestion(id, true);
    res.json({ success: true, data: { question } });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const question = await questionService.createQuestion(user.id, req.body);
    res.status(201).json({ success: true, data: { question } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const id = parseId(req.params.id);
    if (id === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '问题 ID 不合法' },
      });
      return;
    }
    const question = await questionService.updateQuestion(user.id, id, req.body);
    res.json({ success: true, data: { question } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const id = parseId(req.params.id);
    if (id === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '问题 ID 不合法' },
      });
      return;
    }
    await questionService.deleteQuestion(user.id, id);
    res.json({ success: true, data: null });
  }),
};
