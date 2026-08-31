import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\w\u4e00-\u9fa5-]+$/;

function readStringBody(req: Request): Record<string, string> {
  if (!req.body || typeof req.body !== 'object') {
    return {};
  }
  return req.body as Record<string, string>;
}

export function validateRegister(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const body = readStringBody(req);
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword =
    typeof body.confirmPassword === 'string' ? body.confirmPassword : '';

  const errors: string[] = [];
  if (username.length < 2 || username.length > 20) {
    errors.push('用户名长度必须为 2～20 个字符');
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.push('用户名只能包含中文、字母、数字、下划线和连字符');
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    errors.push('邮箱格式不合法');
  }
  if (password.length < 6 || password.length > 72) {
    errors.push('密码长度必须为 6～72 个字符');
  }
  if (password !== confirmPassword) {
    errors.push('两次输入的密码不一致');
  }

  if (errors.length > 0) {
    next(new ApiError(400, 'VALIDATION_ERROR', errors.join('；')));
    return;
  }

  req.body = { username, email, password };
  next();
}

export function validateLogin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const body = readStringBody(req);
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const errors: string[] = [];
  if (!EMAIL_PATTERN.test(email)) {
    errors.push('邮箱格式不合法');
  }
  if (password.length === 0) {
    errors.push('密码不能为空');
  }

  if (errors.length > 0) {
    next(new ApiError(400, 'VALIDATION_ERROR', errors.join('；')));
    return;
  }

  req.body = { email, password };
  next();
}
