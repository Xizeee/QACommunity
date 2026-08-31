import { authService, RegisterInput } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { Request, Response } from 'express';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body as RegisterInput);
    res.status(201).json({ success: true, data: { user } });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  }),

  // JWT 无状态退出：服务端无需处理，客户端丢弃 Token 即可
  logout: (_req: Request, res: Response) => {
    res.json({ success: true, data: null });
  },

  me: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: { user: req.user } });
  }),
};
