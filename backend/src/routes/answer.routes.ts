import { Router } from 'express';
import { answerController } from '../controllers/answer.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateAnswerContent } from '../middlewares/validation.middleware';

export const answerRouter = Router();

answerRouter.patch('/:id', requireAuth, validateAnswerContent, answerController.update);
answerRouter.delete('/:id', requireAuth, answerController.remove);
