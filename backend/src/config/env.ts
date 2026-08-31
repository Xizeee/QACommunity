import dotenv from 'dotenv';

dotenv.config();

export interface Env {
  nodeEnv: string;
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  authSecret: string;
  authExpiresIn: string;
  allowedOrigins: string[];
}

const env = process.env;

function parsePort(value: string | undefined, fallback: number): number {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
}

export const config: Env = {
  nodeEnv: env.NODE_ENV ?? 'development',
  port: parsePort(env.PORT, 3000),
  database: {
    host: env.DATABASE_HOST ?? 'localhost',
    port: parsePort(env.DATABASE_PORT, 3306),
    name: env.DATABASE_NAME ?? 'qa_community',
    user: env.DATABASE_USER ?? 'root',
    password: env.DATABASE_PASSWORD ?? '',
  },
  authSecret: env.AUTH_SECRET ?? '',
  authExpiresIn: env.AUTH_EXPIRES_IN ?? '7d',
  allowedOrigins: (env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
