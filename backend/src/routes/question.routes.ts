import { Router } from 'express';
import { questionController } from '../controllers/question.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateQuestionContent } from '../middlewares/validation.middleware';

export const questionRouter = Router();

questionRouter.get('/', questionController.list);
questionRouter.get('/:id', questionController.get);
questionRouter.post('/', requireAuth, validateQuestionContent, questionController.create);
questionRouter.patch('/:id', requireAuth, validateQuestionContent, questionController.update);
questionRouter.delete('/:id', requireAuth, questionController.remove);
