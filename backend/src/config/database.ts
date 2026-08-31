import mysql from 'mysql2/promise';
import { config } from './env';

export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export async function testConnection(): Promise<void> {
  const connection = await pool.getConnection();
  connection.release();
}
