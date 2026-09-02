import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { questionService } from '../services/question.service';
import { answerService } from '../services/answer.service';
import { pointService } from '../services/point.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/user';

export const userController = {
  profile: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const profile = await userService.getProfile(user.id);
    res.json({ success: true, data: { profile } });
  }),

  questions: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const result = await questionService.listQuestionsByUser(
      user.id,
      req.query as Record<string, string | undefined>,
    );
    res.json({ success: true, data: result });
  }),

  answers: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const result = await answerService.listAnswersByUser(
      user.id,
      req.query as Record<string, string | undefined>,
    );
    res.json({ success: true, data: result });
  }),

  points: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as AuthUser;
    const result = await pointService.listPointsByUser(
      user.id,
      req.query as Record<string, string | undefined>,
    );
    res.json({ success: true, data: result });
  }),
};
