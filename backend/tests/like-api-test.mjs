// 点赞模块 API 验证脚本（Node 保证 UTF-8 编码）
// 用法：先启动后端，再执行 node tests/like-api-test.mjs
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

const db = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'qa_community',
};

async function main() {
  const conn = await mysql.createConnection(db);

  // 清理点赞数据，保证从干净状态开始
  await conn.query('DELETE FROM likes');
  await conn.query('UPDATE questions SET like_count = 0');
  await conn.query('UPDATE answers SET like_count = 0');

  const testerLogin = await api('POST', '/auth/login', {
    body: { email: 'tester@example.com', password: 'secret123' },
  });
  const bobLogin = await api('POST', '/auth/login', {
    body: { email: 'bob@example.com', password: 'password123' },
  });
  check('登录 tester', testerLogin.status === 200, testerLogin.json?.error?.message ?? '');
  check('登录 bob', bobLogin.status === 200, bobLogin.json?.error?.message ?? '');
  const tester = testerLogin.json?.data?.token;
  const bob = bobLogin.json?.data?.token;
  if (!tester || !bob) {
    console.error('无法获取登录 token，终止');
    await conn.end();
    return;
  }

  // tester 创建问题，bob 创建回答（用于交叉点赞）
  let r = await api('POST', '/questions', {
    token: tester,
    body: { title: '点赞功能验证问题标题', content: '用于点赞测试的内容', tagIds: [1] },
  });
  const question = r.json?.data?.question;
  check('创建问题 201', r.status === 201 && question?.id > 0);

  r = await api('POST', `/questions/${question.id}/answers`, {
    token: bob,
    body: { content: '回答内容，用于点赞测试。' },
  });
  const answer = r.json?.data?.answer;
  check('创建回答 201', r.status === 201 && answer?.id > 0);

  const qid = question.id;
  const aid = answer.id;

  // 1. 未登录点赞 → 401
  r = await api('POST', '/likes', { body: { targetType: 'QUESTION', targetId: qid } });
  check('未登录点赞 401', r.status === 401 && r.json.error.code === 'AUTH_REQUIRED');

  // 2. 无效 targetType → 400
  r = await api('POST', '/likes', { token: bob, body: { targetType: 'COMMENT', targetId: qid } });
  check('无效 targetType 400', r.status === 400 && r.json.error.code === 'VALIDATION_ERROR');

  // 3. 无效 targetId → 400
  r = await api('POST', '/likes', { token: bob, body: { targetType: 'QUESTION', targetId: -1 } });
  check('无效 targetId 400', r.status === 400 && r.json.error.code === 'VALIDATION_ERROR');

  // 4. 点赞不存在的目标 → 404
  r = await api('POST', '/likes', { token: bob, body: { targetType: 'QUESTION', targetId: 99999 } });
  check('不存在的目标 404', r.status === 404 && r.json.error.code === 'QUESTION_NOT_FOUND');
  r = await api('POST', '/likes', { token: tester, body: { targetType: 'ANSWER', targetId: 99999 } });
  check('不存在的回答 404', r.status === 404 && r.json.error.code === 'ANSWER_NOT_FOUND');

  // 5. 点赞自己的问题 → 400
  r = await api('POST', '/likes', { token: tester, body: { targetType: 'QUESTION', targetId: qid } });
  check('点赞自己的问题被拒', r.status === 400 && r.json.error.code === 'CANNOT_LIKE_OWN');

  // 6. 点赞自己的回答 → 400
  r = await api('POST', '/likes', { token: bob, body: { targetType: 'ANSWER', targetId: aid } });
  check('点赞自己的回答被拒', r.status === 400 && r.json.error.code === 'CANNOT_LIKE_OWN');

  // 7. bob 点赞问题
  r = await api('POST', '/likes', { token: bob, body: { targetType: 'QUESTION', targetId: qid } });
  check('点赞问题 200', r.status === 200 && r.json.data.liked === true && r.json.data.likeCount === 1);

  // 8. 重复点赞（幂等，不重复计数）
  r = await api('POST', '/likes', { token: bob, body: { targetType: 'QUESTION', targetId: qid } });
  check('重复点赞幂等', r.status === 200 && r.json.data.liked === true && r.json.data.likeCount === 1);

  // 9. tester 点赞回答
  r = await api('POST', '/likes', { token: tester, body: { targetType: 'ANSWER', targetId: aid } });
  check('点赞回答 200', r.status === 200 && r.json.data.liked === true && r.json.data.likeCount === 1);

  // 10. 统计数量与数据库一致
  let [rows] = await conn.query('SELECT like_count FROM questions WHERE id = ?', [qid]);
  check('问题 like_count 与库一致', Number(rows[0].like_count) === 1);
  [rows] = await conn.query('SELECT like_count FROM answers WHERE id = ?', [aid]);
  check('回答 like_count 与库一致', Number(rows[0].like_count) === 1);
  [rows] = await conn.query('SELECT COUNT(*) AS n FROM likes WHERE target_type = "QUESTION" AND target_id = ?', [qid]);
  check('likes 记录数与计数一致', Number(rows[0].n) === 1);

  // 11. 状态查询
  r = await api('GET', `/likes/status?targetType=QUESTION&targetIds=${qid},${aid}`, { token: bob });
  check('问题点赞状态', r.status === 200 && r.json.data.likedTargetIds.includes(qid));
  r = await api('GET', `/likes/status?targetType=ANSWER&targetIds=${aid}`, { token: tester });
  check('回答点赞状态', r.status === 200 && r.json.data.likedTargetIds.includes(aid));
  r = await api('GET', `/likes/status?targetType=QUESTION&targetIds=${qid}`);
  check('未登录查询状态 401', r.status === 401);

  // 12. 取消点赞
  r = await api('DELETE', '/likes', { token: bob, body: { targetType: 'QUESTION', targetId: qid } });
  check('取消点赞 200', r.status === 200 && r.json.data.liked === false && r.json.data.likeCount === 0);
  [rows] = await conn.query('SELECT like_count FROM questions WHERE id = ?', [qid]);
  check('取消后 like_count = 0', Number(rows[0].like_count) === 0);

  // 13. 重复取消（幂等）
  r = await api('DELETE', '/likes', { token: bob, body: { targetType: 'QUESTION', targetId: qid } });
  check('重复取消幂等', r.status === 200 && r.json.data.liked === false && r.json.data.likeCount === 0);
  [rows] = await conn.query('SELECT like_count FROM questions WHERE id = ?', [qid]);
  check('重复取消后 like_count 仍为 0', Number(rows[0].like_count) === 0);

  // 14. 并发：同一用户 10 次并发点赞同一回答，只能产生 1 条记录
  const concurrent = await Promise.all(
    Array.from({ length: 10 }, () =>
      api('POST', '/likes', { token: tester, body: { targetType: 'ANSWER', targetId: aid } }),
    ),
  );
  check('并发点赞全部返回 200', concurrent.every((item) => item.status === 200));
  [rows] = await conn.query('SELECT like_count FROM answers WHERE id = ?', [aid]);
  check('并发点赞后回答 like_count = 1', Number(rows[0].like_count) === 1);
  [rows] = await conn.query('SELECT COUNT(*) AS n FROM likes WHERE target_type = "ANSWER" AND target_id = ?', [aid]);
  check('并发点赞仅 1 条记录', Number(rows[0].n) === 1);

  // 15. 并发：同一用户同时点赞+取消，最终状态一致（不出现错误计数）
  await conn.query('DELETE FROM likes WHERE target_type = "ANSWER" AND target_id = ?', [aid]);
  await conn.query('UPDATE answers SET like_count = 0 WHERE id = ?', [aid]);
  const mixed = await Promise.all([
    api('POST', '/likes', { token: tester, body: { targetType: 'ANSWER', targetId: aid } }),
    api('DELETE', '/likes', { token: tester, body: { targetType: 'ANSWER', targetId: aid } }),
  ]);
  check('点赞+取消并发返回 200', mixed.every((item) => item.status === 200));
  [rows] = await conn.query('SELECT like_count FROM answers WHERE id = ?', [aid]);
  const mixedCount = Number(rows[0].like_count);
  [rows] = await conn.query('SELECT COUNT(*) AS n FROM likes WHERE target_type = "ANSWER" AND target_id = ?', [aid]);
  const mixedLikes = Number(rows[0].n);
  check('点赞+取消并发计数一致', mixedCount === mixedLikes && (mixedCount === 0 || mixedCount === 1), `count=${mixedCount}, likes=${mixedLikes}`);

  // 16. 刷新后状态：重新查询状态接口
  r = await api('GET', `/likes/status?targetType=ANSWER&targetIds=${aid}`, { token: tester });
  const likedNow = r.json.data.likedTargetIds.includes(aid);
  [rows] = await conn.query('SELECT COUNT(*) AS n FROM likes WHERE user_id = (SELECT id FROM users WHERE email = "tester@example.com") AND target_type = "ANSWER" AND target_id = ?', [aid]);
  check('刷新后点赞状态与库一致', likedNow === (Number(rows[0].n) > 0));

  // 清理：删除测试数据（软删除问题，硬清点赞与测试回答）
  await conn.query('DELETE FROM likes');
  await conn.query('UPDATE questions SET like_count = 0');
  await conn.query('UPDATE answers SET like_count = 0');
  await conn.query('DELETE FROM answers WHERE id = ?', [aid]);
  await api('DELETE', `/questions/${qid}`, { token: tester });

  await conn.end();
  console.log('done');
}

main().catch((e) => {
  console.error('SCRIPT ERROR:', e);
  process.exit(1);
});
