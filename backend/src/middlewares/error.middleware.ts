import { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/apiError';

// 统一错误出口：业务错误返回错误码，其余错误不向前端暴露内部信息
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
  });
};
