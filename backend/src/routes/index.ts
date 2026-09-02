import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { questionRouter } from './question.routes';
import { tagRouter } from './tag.routes';
import { answerRouter } from './answer.routes';
import { likeRouter } from './like.routes';
import { meRouter, usersRouter } from './user.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/questions', questionRouter);
apiRouter.use('/answers', answerRouter);
apiRouter.use('/tags', tagRouter);
apiRouter.use('/likes', likeRouter);
apiRouter.use('/me', meRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/', healthRouter);

export default apiRouter;
