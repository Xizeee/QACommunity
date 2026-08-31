import { Router } from 'express';
import { questionController } from '../controllers/question.controller';
import { answerController } from '../controllers/answer.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateAnswerContent, validateQuestionContent } from '../middlewares/validation.middleware';

export const questionRouter = Router();

questionRouter.get('/', questionController.list);
questionRouter.get('/:id', questionController.get);
questionRouter.post('/', requireAuth, validateQuestionContent, questionController.create);
questionRouter.patch('/:id', requireAuth, validateQuestionContent, questionController.update);
questionRouter.delete('/:id', requireAuth, questionController.remove);

// 回答挂在问题资源下（TECH_DESIGN 27）
questionRouter.get('/:questionId/answers', answerController.list);
questionRouter.post(
  '/:questionId/answers',
  requireAuth,
  validateAnswerContent,
  answerController.create,
);
