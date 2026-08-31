import { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 不会自动捕获 async 抛出的异常，统一包装后交给 error middleware
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
