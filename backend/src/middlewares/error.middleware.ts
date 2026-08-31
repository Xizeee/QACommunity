import { ErrorRequestHandler } from 'express';

// 统一错误响应，禁止将数据库异常等内部信息返回给前端
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[error]', err);

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
  });
};
