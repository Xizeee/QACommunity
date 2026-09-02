import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';

// 个人中心相关路由（TECH_DESIGN 30：/me/*）
export const meRouter = Router();

meRouter.get('/', requireAuth, userController.profile);
meRouter.get('/questions', requireAuth, userController.questions);
meRouter.get('/answers', requireAuth, userController.answers);
meRouter.get('/points', requireAuth, userController.points);
