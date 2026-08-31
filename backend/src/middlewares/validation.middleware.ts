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

const MAX_TITLE_LENGTH = 100;
const MIN_TITLE_LENGTH = 5;
const MAX_CONTENT_LENGTH = 50000;
const MIN_TAGS = 1;
const MAX_TAGS = 5;

// 回答内容校验（PRD 12.1：不能为空，支持 Markdown）
export function validateAnswerContent(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.body || typeof req.body !== 'object') {
    next(new ApiError(400, 'VALIDATION_ERROR', '请求体不能为空'));
    return;
  }
  const content = req.body.content;
  if (typeof content !== 'string' || content.trim().length === 0) {
    next(new ApiError(400, 'VALIDATION_ERROR', '回答内容不能为空'));
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    next(new ApiError(400, 'VALIDATION_ERROR', `回答内容不能超过 ${MAX_CONTENT_LENGTH} 个字符`));
    return;
  }
  req.body = { content };
  next();
}

// 问题标题/内容/标签的创建与更新共用同一套规则（PRD 9.1 / 9.3）
export function validateQuestionContent(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.body || typeof req.body !== 'object') {
    next(new ApiError(400, 'VALIDATION_ERROR', '请求体不能为空'));
    return;
  }
  const body = req.body as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title : '';
  const content = typeof body.content === 'string' ? body.content : '';
  const tagIds = Array.isArray(body.tagIds) ? body.tagIds : [];

  const errors: string[] = [];
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < MIN_TITLE_LENGTH || trimmedTitle.length > MAX_TITLE_LENGTH) {
    errors.push(`标题长度必须为 ${MIN_TITLE_LENGTH}～${MAX_TITLE_LENGTH} 个字符`);
  }
  if (content.trim().length === 0) {
    errors.push('内容不能为空');
  } else if (content.length > MAX_CONTENT_LENGTH) {
    errors.push(`内容长度不能超过 ${MAX_CONTENT_LENGTH} 个字符`);
  }
  const uniqueTags = [...new Set(tagIds)];
  if (uniqueTags.length < MIN_TAGS || uniqueTags.length > MAX_TAGS) {
    errors.push(`标签数量必须为 ${MIN_TAGS}～${MAX_TAGS} 个`);
  } else if (uniqueTags.some((id) => typeof id !== 'number' || !Number.isInteger(id) || id <= 0)) {
    errors.push('标签 ID 不合法');
  }

  if (errors.length > 0) {
    next(new ApiError(400, 'VALIDATION_ERROR', errors.join('；')));
    return;
  }

  req.body = {
    title: trimmedTitle,
    content,
    tagIds: uniqueTags as number[],
  };
  next();
}
