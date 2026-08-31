import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/', healthRouter);

export default apiRouter;
