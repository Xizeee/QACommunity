import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { questionService } from '../services/question.service';
import { answerService } from '../services/answer.service';
import { pointService } from '../services/point.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/apiError';
import { AuthUser } from '../types/user';

// /users/:id 路径参数：必须是正整数
function parseUserId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', '用户 ID 不合法');
  }
  return id;
}

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

  // 公开用户主页（PRD 20.1 / TECH_DESIGN 30，未登录可访问）
  publicProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = parseUserId(req.params.id as string);
    const profile = await userService.getPublicProfile(userId);
    res.json({ success: true, data: { profile } });
  }),

  publicQuestions: asyncHandler(async (req: Request, res: Response) => {
    const userId = parseUserId(req.params.id as string);
    await userService.assertExists(userId);
    const result = await questionService.listQuestionsByUser(
      userId,
      req.query as Record<string, string | undefined>,
    );
    res.json({ success: true, data: result });
  }),

  publicAnswers: asyncHandler(async (req: Request, res: Response) => {
    const userId = parseUserId(req.params.id as string);
    await userService.assertExists(userId);
    const result = await answerService.listAnswersByUser(
      userId,
      req.query as Record<string, string | undefined>,
    );
    res.json({ success: true, data: result });
  }),
};
