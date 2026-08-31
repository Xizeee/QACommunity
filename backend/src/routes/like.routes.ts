import { Router } from 'express';
import { likeController } from '../controllers/like.controller';
import { requireAuth } from '../middlewares/auth.middleware';

export const likeRouter = Router();

likeRouter.post('/', requireAuth, likeController.like);
likeRouter.delete('/', requireAuth, likeController.unlike);
likeRouter.get('/status', requireAuth, likeController.status);
