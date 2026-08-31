import axios from 'axios';

const TOKEN_KEY = 'qa_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// 后端统一错误结构转换为可被 UI 消费的异常
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const body = error.response.data.error as { code?: string; message?: string };
      throw new ApiClientError(
        body.message ?? '请求失败',
        body.code ?? 'UNKNOWN_ERROR',
        error.response.status,
      );
    }
    throw new ApiClientError('网络错误，请稍后重试', 'NETWORK_ERROR', 0);
  },
);
