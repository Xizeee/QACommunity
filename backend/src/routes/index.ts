import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { questionRouter } from './question.routes';
import { tagRouter } from './tag.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/questions', questionRouter);
apiRouter.use('/tags', tagRouter);
apiRouter.use('/', healthRouter);

export default apiRouter;
