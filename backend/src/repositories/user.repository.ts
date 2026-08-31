import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../config/database';
import { UserRecord, UserRole } from '../types/user';

interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  points: number;
  created_at: Date;
  updated_at: Date;
}

const SELECT_COLUMNS = `id, username, email, password_hash, avatar, bio, role, points, created_at, updated_at`;

function toRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    avatar: row.avatar,
    bio: row.bio,
    role: row.role,
    points: row.points,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
}

export const userRepository = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE email = :email`,
      { email },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  async findByUsername(username: string): Promise<UserRecord | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE username = :username`,
      { username },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  async findById(id: number): Promise<UserRecord | null> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE id = :id`,
      { id },
    );
    return rows[0] ? toRecord(rows[0]) : null;
  },

  async create(input: CreateUserInput): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :passwordHash)',
      {
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
      },
    );
    return result.insertId;
  },
};
