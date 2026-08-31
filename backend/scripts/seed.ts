/*
 * @Author: Cqs 18897653566@163.com
 * @Date: 2026-08-31 21:19:40
 * @LastEditors: Cqs 18897653566@163.com
 * @LastEditTime: 2026-08-31 23:38:32
 * @Description: 
 * Copyright (c) 2026 by 18897653566@163.com All Rights Reserved. 
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// PRD 15.1 的基础标签，仅用于开发环境初始化（幂等，可重复执行）
const SEED_TAGS = [
  'React',
  'TypeScript',
  'Node.js',
  'MySQL',
  'Python',
  'Linux',
  'Docker',
  'Java',
  'Vue',
];

async function main(): Promise<void> {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    database: process.env.DATABASE_NAME ?? 'qa_community',
  });

  try {
    for (const name of SEED_TAGS) {
      await connection.execute(
        'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
        [name],
      );
    }
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT name FROM tags ORDER BY id',
    );
    console.log(`Seeded tags: ${rows.map((row) => row.name).join(', ')}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
