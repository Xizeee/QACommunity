import { http } from '../http';
import type { ApiSuccess, User } from '../../types';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  user: User;
  token: string;
  tokenExpiresIn: string;
}

export async function registerApi(payload: RegisterPayload): Promise<User> {
  const response = await http.post<ApiSuccess<{ user: User }>>(
    '/auth/register',
    payload,
  );
  return response.data.data.user;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResult> {
  const response = await http.post<ApiSuccess<LoginResult>>(
    '/auth/login',
    payload,
  );
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  await http.post('/auth/logout');
}

export async function fetchCurrentUserApi(): Promise<User> {
  const response = await http.get<ApiSuccess<{ user: User }>>('/auth/me');
  return response.data.data.user;
}
