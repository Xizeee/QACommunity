import { Router } from 'express';
import { testConnection } from '../config/database';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  try {
    await testConnection();
    res.json({ success: true, data: { status: 'ok', database: 'up' } });
  } catch {
    res.status(503).json({
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: '数据库不可用' },
    });
  }
});
