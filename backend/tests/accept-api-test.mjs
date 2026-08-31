// 采纳答案 + 积分流水 API 验证脚本（Node 保证 UTF-8 编码）
// 用法：先启动后端，再执行 node tests/accept-api-test.mjs
import mysql from 'mysql2/promise';

const BASE = 'http://localhost:3000/api/v1';

async function api(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function check(name, cond, extra = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' | ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
}

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'qa_community',
  });

  const testerLogin = await api('POST', '/auth/login', {
    body: { email: 'tester@example.com', password: 'secret123' },
  });
  const bobLogin = await api('POST', '/auth/login', {
    body: { email: 'bob@example.com', password: 'password123' },
  });
  const tester = testerLogin.json?.data?.token;
  const bob = bobLogin.json?.data?.token;
  if (!tester || !bob) {
    console.error('无法登录，终止');
    await conn.end();
    return;
  }

  const [bobRow] = await conn.query('SELECT points FROM users WHERE email = ?', [
    'bob@example.com',
  ]);
  const bobPointsBefore = Number(bobRow[0].points);

  // tester 创建两个问题，bob 各回答
  let r = await api('POST', '/questions', {
    token: tester,
    body: { title: '采纳验证问题一', content: '内容', tagIds: [1] },
  });
  const q1 = r.json?.data?.question;
  r = await api('POST', `/questions/${q1.id}/answers`, { token: bob, body: { content: '回答一' } });
  const a1 = r.json?.data?.answer;
  r = await api('POST', `/questions/${q1.id}/answers`, { token: bob, body: { content: '回答二' } });
  const a2 = r.json?.data?.answer;

  r = await api('POST', '/questions', {
    token: tester,
    body: { title: '采纳跨问题验证', content: '内容', tagIds: [1] },
  });
  const q2 = r.json?.data?.question;
  r = await api('POST', `/questions/${q2.id}/answers`, { token: bob, body: { content: '跨问题回答' } });
  const a3 = r.json?.data?.answer;

  // 1. 未登录采纳 → 401
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { body: { answerId: a1.id } });
  check('未登录采纳 401', r.status === 401 && r.json.error.code === 'AUTH_REQUIRED');

  // 2. 非提问者采纳 → 403
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { token: bob, body: { answerId: a1.id } });
  check('非提问者采纳 403', r.status === 403 && r.json.error.code === 'FORBIDDEN');

  // 3. 跨问题答案采纳 → 400 INVALID_ANSWER
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { token: tester, body: { answerId: a3.id } });
  check('跨问题答案采纳 400', r.status === 400 && r.json.error.code === 'INVALID_ANSWER');

  // 4. 无效 answerId → 400
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { token: tester, body: { answerId: 'abc' } });
  check('无效 answerId 400', r.status === 400 && r.json.error.code === 'VALIDATION_ERROR');

  // 5. 不存在的回答 → 404
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { token: tester, body: { answerId: 99999 } });
  check('不存在的回答 404', r.status === 404 && r.json.error.code === 'ANSWER_NOT_FOUND');

  // 6. 提问者采纳 A1 → 200
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { token: tester, body: { answerId: a1.id } });
  check('采纳回答 200', r.status === 200 && r.json.data.answer.status === 'ACCEPTED' && r.json.data.answer.id === a1.id);

  // 7. 问题状态与 accepted_answer_id
  r = await api('GET', `/questions/${q1.id}`);
  check('问题状态 SOLVED', r.json.data.question.status === 'SOLVED');
  let rows = await conn.query('SELECT accepted_answer_id FROM questions WHERE id = ?', [q1.id]);
  check('accepted_answer_id 正确', Number(rows[0][0].accepted_answer_id) === a1.id);

  // 8. 积分余额 +20
  rows = await conn.query('SELECT points FROM users WHERE email = ?', ['bob@example.com']);
  check('积分余额 +20', Number(rows[0][0].points) === bobPointsBefore + 20);

  // 9. 积分流水正确
  rows = await conn.query(
    'SELECT amount, type, idempotency_key FROM point_transactions WHERE idempotency_key = ?',
    [`ANSWER_ACCEPTED:${a1.id}`],
  );
  check(
    '积分流水正确',
    rows[0].length === 1 && Number(rows[0][0].amount) === 20 && rows[0][0].type === 'ANSWER_ACCEPTED',
  );

  // 10. 重复采纳同一答案 → 幂等 200，不重复发放
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { token: tester, body: { answerId: a1.id } });
  check('重复采纳同一答案幂等', r.status === 200 && r.json.data.answer.status === 'ACCEPTED');
  rows = await conn.query('SELECT points FROM users WHERE email = ?', ['bob@example.com']);
  check('重复采纳不重复发积分', Number(rows[0][0].points) === bobPointsBefore + 20);
  rows = await conn.query('SELECT COUNT(*) AS n FROM point_transactions WHERE idempotency_key = ?', [
    `ANSWER_ACCEPTED:${a1.id}`,
  ]);
  check('重复采纳流水仅 1 条', Number(rows[0][0].n) === 1);

  // 11. 采纳另一答案 → 400 不可更换
  r = await api('POST', `/questions/${q1.id}/accept-answer`, { token: tester, body: { answerId: a2.id } });
  check('采纳另一答案被拒', r.status === 400 && r.json.error.code === 'QUESTION_ALREADY_SOLVED');

  // 12. 并发采纳两个不同答案 → 仅一个成功，积分只发一次
  r = await api('POST', '/questions', {
    token: tester,
    body: { title: '并发采纳验证问题', content: '内容', tagIds: [1] },
  });
  const q3 = r.json?.data?.question;
  r = await api('POST', `/questions/${q3.id}/answers`, { token: bob, body: { content: '并发回答一' } });
  const c1 = r.json?.data?.answer;
  r = await api('POST', `/questions/${q3.id}/answers`, { token: bob, body: { content: '并发回答二' } });
  const c2 = r.json?.data?.answer;

  const concurrent = await Promise.all([
    api('POST', `/questions/${q3.id}/accept-answer`, { token: tester, body: { answerId: c1.id } }),
    api('POST', `/questions/${q3.id}/accept-answer`, { token: tester, body: { answerId: c2.id } }),
  ]);
  const okCount = concurrent.filter((x) => x.status === 200).length;
  check('并发采纳仅一个成功', okCount === 1, `ok=${okCount}`);
  rows = await conn.query('SELECT COUNT(*) AS n FROM answers WHERE question_id = ? AND status = "ACCEPTED"', [q3.id]);
  check('并发采纳仅一个 ACCEPTED', Number(rows[0][0].n) === 1);
  rows = await conn.query('SELECT points FROM users WHERE email = ?', ['bob@example.com']);
  check('并发采纳积分只发一次', Number(rows[0][0].points) === bobPointsBefore + 40, `points=${Number(rows[0][0].points)}`);

  // 清理
  await conn.query('UPDATE users SET points = ? WHERE email = ?', [bobPointsBefore, 'bob@example.com']);
  await conn.query('DELETE FROM point_transactions WHERE reference_type = "ANSWER" AND reference_id IN (?, ?, ?)', [a1.id, c1.id, c2.id]);
  await api('DELETE', `/questions/${q1.id}`, { token: tester });
  await api('DELETE', `/questions/${q2.id}`, { token: tester });
  await api('DELETE', `/questions/${q3.id}`, { token: tester });
  await conn.query('DELETE FROM answers WHERE id IN (?, ?, ?, ?, ?)', [a1.id, a2.id, a3.id, c1.id, c2.id]);

  await conn.end();
  console.log('done');
}

main().catch((e) => {
  console.error('SCRIPT ERROR:', e);
  process.exit(1);
});
