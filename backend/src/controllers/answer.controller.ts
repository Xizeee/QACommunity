import { Request, Response } from 'express';
import { answerService } from '../services/answer.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/user';

function parseId(value: string): number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function invalidId(res: Response, label: string): void {
  res.status(400).json({
    success: false,
    error: { code: 'VALIDATION_ERROR', message: `${label}不合法` },
  });
}

export const answerController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const questionId = parseId(req.params.questionId);
    if (questionId === 0) {
      invalidId(res, '问题 ID ');
      return;
    }
    const query = req.query as Record<string, string | undefined>;
    const result = await answerService.listAnswers(questionId, query);
    res.json({ success: true, data: result });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const questionId = parseId(req.params.questionId);
    if (questionId === 0) {
      invalidId(res, '问题 ID ');
      return;
    }
    const answer = await answerService.createAnswer(user.id, questionId, req.body.content);
    res.status(201).json({ success: true, data: { answer } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const answerId = parseId(req.params.id);
    if (answerId === 0) {
      invalidId(res, '回答 ID ');
      return;
    }
    const answer = await answerService.updateAnswer(user.id, answerId, req.body.content);
    res.json({ success: true, data: { answer } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const answerId = parseId(req.params.id);
    if (answerId === 0) {
      invalidId(res, '回答 ID ');
      return;
    }
    await answerService.deleteAnswer(user.id, answerId);
    res.json({ success: true, data: null });
  }),
};
