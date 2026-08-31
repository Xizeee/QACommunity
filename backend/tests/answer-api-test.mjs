// 回答模块 API 验证脚本（Node 保证 UTF-8 编码）
// 用法：先启动后端，再执行 node tests/answer-api-test.mjs（需 answers 表为空）
const mysql = await import('file:///D:/agentCode/QA%E7%A4%BE%E5%8C%BA/backend/node_modules/mysql2/promise.js');
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
  const conn = await mysql.default.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'qa_community',
  });
  // 清理回答数据并重置问题统计
  await conn.query('TRUNCATE answers');
  await conn.execute('UPDATE questions SET answer_count = 0');

  const testerLogin = await api('POST', '/auth/login', {
    body: { email: 'tester@example.com', password: 'secret123' },
  });
  const bobLogin = await api('POST', '/auth/login', {
    body: { email: 'bob@example.com', password: 'password123' },
  });
  const tester = testerLogin.json.data.token;
  const bob = bobLogin.json.data.token;

  const [questions] = await conn.query('SELECT id, user_id FROM questions WHERE deleted_at IS NULL ORDER BY id');
  const q1 = questions[0];
  const q2 = questions[1];

  // 1. 未登录发布回答 → 401
  let r = await api('POST', `/questions/${q1.id}/answers`, { body: { content: '未登录的回答' } });
  check('未登录发布回答 401', r.status === 401 && r.json.error.code === 'AUTH_REQUIRED');

  // 2. 不存在的问题 → 404
  r = await api('POST', '/questions/99999/answers', { token: tester, body: { content: '内容' } });
  check('无效问题 QUESTION_NOT_FOUND', r.status === 404 && r.json.error.code === 'QUESTION_NOT_FOUND');

  // 3. 空内容 → 400
  r = await api('POST', `/questions/${q1.id}/answers`, { token: tester, body: { content: '   ' } });
  check('空内容 400', r.status === 400 && r.json.error.code === 'VALIDATION_ERROR');

  // 4. tester 发布回答（问题 1）
  r = await api('POST', `/questions/${q1.id}/answers`, {
    token: tester,
    body: { content: '推荐使用 **Zustand**，轻量且 API 简单：\n\n```js\nimport { create } from "zustand";\n```' },
  });
  const a1 = r.json?.data?.answer;
  check('发布回答 201', r.status === 201 && a1?.id > 0);
  check('回答作者为当前用户', a1?.author?.username === 'tester');
  check('回答关联正确问题', a1?.questionId === q1.id);

  // 5. bob 发布回答（同问题）
  r = await api('POST', `/questions/${q1.id}/answers`, {
    token: bob,
    body: { content: 'Context 适合低频更新的全局状态。' },
  });
  const a2 = r.json?.data?.answer;
  check('第二人发布回答 201', r.status === 201 && a2?.id > 0);

  // 6. answer_count 同步为 2
  r = await api('GET', `/questions/${q1.id}`);
  check('问题 answer_count = 2', r.json.data.question.answerCount === 2);

  // 7. 回答列表（时间升序）
  r = await api('GET', `/questions/${q1.id}/answers`);
  check('回答列表 200 且含 2 条', r.status === 200 && r.json.data.items.length === 2);
  check('列表按时间升序', r.json.data.items[0].id === a1.id && r.json.data.items[1].id === a2.id);
  check('列表分页信息正确', r.json.data.pagination.total === 2 && r.json.data.pagination.page === 1);

  // 8. 分页参数校验
  r = await api('GET', `/questions/${q1.id}/answers?page=0`);
  check('page=0 → 400', r.status === 400);
  r = await api('GET', `/questions/${q1.id}/answers?pageSize=500`);
  check('pageSize=500 → 400', r.status === 400);

  // 9. 不存在问题的回答列表 → 404
  r = await api('GET', '/questions/99999/answers');
  check('不存在问题的回答列表 404', r.status === 404 && r.json.error.code === 'QUESTION_NOT_FOUND');

  // 10. 未登录编辑 → 401
  r = await api('PATCH', `/answers/${a1.id}`, { body: { content: '未登录编辑' } });
  check('未登录编辑 401', r.status === 401);

  // 11. bob 编辑 tester 的回答 → 403
  r = await api('PATCH', `/answers/${a1.id}`, { token: bob, body: { content: 'bob 改别人的回答' } });
  check('无权限编辑他人回答 403', r.status === 403 && r.json.error.code === 'FORBIDDEN');

  // 12. tester 编辑自己的回答
  r = await api('PATCH', `/answers/${a1.id}`, {
    token: tester,
    body: { content: '更新：推荐 Zustand 或 Jotai，按团队规模选择。' },
  });
  check('编辑自己的回答 200', r.status === 200 && r.json.data.answer.content.includes('Jotai'));

  // 13. 未登录删除 → 401
  r = await api('DELETE', `/answers/${a1.id}`);
  check('未登录删除 401', r.status === 401);

  // 14. bob 删除 tester 的回答 → 403
  r = await api('DELETE', `/answers/${a1.id}`, { token: bob });
  check('无权限删除他人回答 403', r.status === 403 && r.json.error.code === 'FORBIDDEN');

  // 15. tester 删除自己的回答 → 200，列表移除且 answer_count 减 1
  r = await api('DELETE', `/answers/${a1.id}`, { token: tester });
  check('删除自己的回答 200', r.status === 200);
  r = await api('GET', `/questions/${q1.id}/answers`);
  check('删除后列表只剩 1 条', r.json.data.items.length === 1 && r.json.data.items[0].id === a2.id);
  r = await api('GET', `/questions/${q1.id}`);
  check('删除后 answer_count = 1', r.json.data.question.answerCount === 1);

  // 16. 重复删除 → 404
  r = await api('DELETE', `/answers/${a1.id}`, { token: tester });
  check('重复删除 404', r.status === 404 && r.json.error.code === 'ANSWER_NOT_FOUND');

  // 17. 已删除问题的回答操作 → QUESTION_NOT_FOUND
  await conn.execute('UPDATE questions SET status = "DELETED", deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [q2.id]);
  r = await api('POST', `/questions/${q2.id}/answers`, { token: tester, body: { content: '回答已删除问题' } });
  check('已删除问题不可回答', r.status === 404 && r.json.error.code === 'QUESTION_NOT_FOUND');
  r = await api('GET', `/questions/${q2.id}/answers`);
  check('已删除问题回答列表 404', r.status === 404);
  await conn.execute('UPDATE questions SET status = "UNSOLVED", deleted_at = NULL WHERE id = ?', [q2.id]);

  // 18. 已采纳的回答禁止删除
  await conn.execute('UPDATE answers SET status = "ACCEPTED" WHERE id = ?', [a2.id]);
  r = await api('DELETE', `/answers/${a2.id}`, { token: bob });
  check('已采纳回答禁止删除 400', r.status === 400 && r.json.error.code === 'ANSWER_ALREADY_ACCEPTED');
  await conn.execute('UPDATE answers SET status = "NORMAL" WHERE id = ?', [a2.id]);

  // 19. ACCEPTED 回答排序优先
  await conn.execute('UPDATE answers SET status = "ACCEPTED" WHERE id = ?', [a2.id]);
  r = await api('POST', `/questions/${q1.id}/answers`, {
    token: tester,
    body: { content: '新回答排在已采纳之后。' },
  });
  const a3 = r.json?.data?.answer;
  r = await api('GET', `/questions/${q1.id}/answers`);
  check('已采纳回答排在列表首位', r.json.data.items[0].id === a2.id);
  await conn.execute('UPDATE answers SET status = "NORMAL" WHERE id = ?', [a2.id]);

  // 清理本次测试数据
  await conn.query('TRUNCATE answers');
  await conn.execute('UPDATE questions SET answer_count = 0');
  await conn.end();
  void a3;
  console.log('done');
}

main().catch((e) => {
  console.error('SCRIPT ERROR:', e);
  process.exit(1);
});
