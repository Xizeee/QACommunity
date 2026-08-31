import express, { RequestHandler } from 'express';
import { config } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(express.json() as RequestHandler);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && config.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  next();
});

app.use('/api/v1', apiRouter);

app.use(errorHandler);

export default app;
