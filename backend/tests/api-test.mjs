// 问题模块 API 验证脚本（Node 保证 UTF-8 编码）
// 用法：先启动后端，再执行 node tests/api-test.mjs（需干净的问题表）
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
  // 登录两个用户
  const testerLogin = await api('POST', '/auth/login', {
    body: { email: 'tester@example.com', password: 'secret123' },
  });
  const bobLogin = await api('POST', '/auth/login', {
    body: { email: 'bob@example.com', password: 'password123' },
  });
  const tester = testerLogin.json.data.token;
  const bob = bobLogin.json.data.token;

  // 之前 curl 创建的问题 1 可能乱码，直接删除（tester 是作者）
  await api('DELETE', '/questions/1', { token: tester });

  // 1. 未登录创建问题 → 401
  let r = await api('POST', '/questions', {
    body: { title: '未登录的问题标题', content: '内容', tagIds: [1] },
  });
  check('未登录创建问题被拒绝 401', r.status === 401 && r.json.error.code === 'AUTH_REQUIRED');

  // 2. 参数校验：标题过短 → 400
  r = await api('POST', '/questions', {
    token: tester,
    body: { title: '太短', content: '内容', tagIds: [1] },
  });
  check('标题过短 400', r.status === 400 && r.json.error.code === 'VALIDATION_ERROR');

  // 3. 参数校验：内容为空 → 400
  r = await api('POST', '/questions', {
    token: tester,
    body: { title: '一个足够长的标题', content: '   ', tagIds: [1] },
  });
  check('内容为空 400', r.status === 400);

  // 4. 参数校验：标签数量 0 → 400
  r = await api('POST', '/questions', {
    token: tester,
    body: { title: '一个足够长的标题', content: '内容', tagIds: [] },
  });
  check('无标签 400', r.status === 400);

  // 5. 参数校验：6 个标签 → 400
  r = await api('POST', '/questions', {
    token: tester,
    body: { title: '一个足够长的标题', content: '内容', tagIds: [1, 2, 3, 4, 5, 6] },
  });
  check('6 个标签 400', r.status === 400);

  // 6. 不存在的标签 → INVALID_TAG
  r = await api('POST', '/questions', {
    token: tester,
    body: { title: '一个足够长的标题', content: '内容', tagIds: [999] },
  });
  check('不存在标签 INVALID_TAG', r.status === 400 && r.json.error.code === 'INVALID_TAG');

  // 7. tester 创建问题 A（React + TypeScript）
  r = await api('POST', '/questions', {
    token: tester,
    body: {
      title: 'React 中如何管理全局状态？',
      content: '项目组件层级较深，props 传递麻烦。\n\n```js\nconst [s, setS] = useState(0);\n```\n\n有推荐方案吗？',
      tagIds: [1, 2],
    },
  });
  const qA = r.json?.data?.question;
  check('创建问题 A 201', r.status === 201 && qA?.id > 0);
  check('问题 A 作者为当前用户', qA?.author?.username === 'tester');
  check('问题 A 标签关联正确', JSON.stringify(qA?.tags?.map((t) => t.name)) === JSON.stringify(['React', 'TypeScript']));
  check('问题 A 中文无乱码', qA?.title === 'React 中如何管理全局状态？');

  // 8. bob 创建问题 B（Node.js）
  r = await api('POST', '/questions', {
    token: bob,
    body: { title: 'Node.js 如何优雅地处理异步错误？', content: 'try/catch 在 async 场景下怎么写最好？', tagIds: [3] },
  });
  const qB = r.json?.data?.question;
  check('创建问题 B 201', r.status === 201 && qB?.id > 0);

  // 9. 列表（默认 latest）
  r = await api('GET', '/questions');
  check('列表 200 且含两个问题', r.status === 200 && r.json.data.items.length === 2);
  check('默认分页信息正确', r.json.data.pagination.page === 1 && r.json.data.pagination.total === 2);
  check('latest 排序为新问题在前', r.json.data.items[0].id === qB.id);

  // 10. sort=unsolved
  r = await api('GET', '/questions?sort=unsolved');
  check('unsolved 排序 200', r.status === 200 && r.json.data.items.length === 2);

  // 11. sort 非法 → 400
  r = await api('GET', '/questions?sort=hotnew');
  check('非法 sort 400', r.status === 400 && r.json.error.code === 'VALIDATION_ERROR');

  // 12. 分页参数非法 → 400
  r = await api('GET', '/questions?page=0');
  check('page=0 → 400', r.status === 400);
  r = await api('GET', '/questions?pageSize=200');
  check('pageSize=200 → 400', r.status === 400);

  // 13. tag 筛选
  r = await api('GET', '/questions?tag=React');
  check('tag=React 筛选只返回问题 A', r.status === 200 && r.json.data.items.length === 1 && r.json.data.items[0].id === qA.id);
  r = await api('GET', '/questions?tag=NotExist');
  check('不存在标签返回空列表', r.status === 200 && r.json.data.items.length === 0);

  // 14. 详情 + 浏览量自增
  r = await api('GET', `/questions/${qA.id}`);
  check('详情 200', r.status === 200 && r.json.data.question.id === qA.id);
  check('详情内容完整', r.json.data.question.content.includes('useState'));
  const viewsAfterFirst = r.json.data.question.viewCount;
  r = await api('GET', `/questions/${qA.id}`);
  check('浏览量自增', r.json.data.question.viewCount === viewsAfterFirst + 1);

  // 15. 不存在的问题 → 404
  r = await api('GET', '/questions/99999');
  check('问题不存在 404', r.status === 404 && r.json.error.code === 'QUESTION_NOT_FOUND');

  // 16. bob 编辑 tester 的问题 → 403
  r = await api('PATCH', `/questions/${qA.id}`, {
    token: bob,
    body: { title: 'bob 想改别人的标题', content: '内容', tagIds: [1] },
  });
  check('无权限编辑他人问题 403', r.status === 403 && r.json.error.code === 'FORBIDDEN');

  // 17. 未登录编辑 → 401
  r = await api('PATCH', `/questions/${qA.id}`, {
    body: { title: '未登录想改标题', content: '内容', tagIds: [1] },
  });
  check('未登录编辑 401', r.status === 401);

  // 18. tester 编辑自己的问题（改标题 + 换标签）
  r = await api('PATCH', `/questions/${qA.id}`, {
    token: tester,
    body: { title: 'React 全局状态管理最佳实践是什么？', content: '更新后的内容：希望了解 Context 与 Zustand 的取舍。', tagIds: [1, 9] },
  });
  check('编辑自己的问题 200', r.status === 200 && r.json.data.question.title === 'React 全局状态管理最佳实践是什么？');
  check('编辑后标签已替换', JSON.stringify(r.json.data.question.tags.map((t) => t.name)) === JSON.stringify(['React', 'Vue']));

  // 19. bob 删除 tester 的问题 → 403
  r = await api('DELETE', `/questions/${qA.id}`, { token: bob });
  check('无权限删除他人问题 403', r.status === 403 && r.json.error.code === 'FORBIDDEN');

  // 20. tester 删除自己的问题 B？（bob 的）——先验证 bob 删除自己的问题 B
  r = await api('DELETE', `/questions/${qB.id}`, { token: bob });
  check('删除自己的问题 200', r.status === 200);

  // 21. 已删除问题：详情 404、不出现在列表
  r = await api('GET', `/questions/${qB.id}`);
  check('已删除问题详情 404', r.status === 404 && r.json.error.code === 'QUESTION_NOT_FOUND');
  r = await api('GET', '/questions');
  check('已删除问题不在列表中', r.json.data.items.every((q) => q.id !== qB.id));
  r = await api('GET', '/questions?sort=unsolved');
  check('已删除问题不在 unsolved 列表中', r.json.data.items.every((q) => q.id !== qB.id));
  r = await api('GET', '/questions?tag=Node.js');
  check('已删除问题不在标签筛选结果中', r.json.data.items.every((q) => q.id !== qB.id));

  // 22. 重复删除 → 404
  r = await api('DELETE', `/questions/${qB.id}`, { token: bob });
  check('重复删除 404', r.status === 404);

  // 23. hot 排序验证：为问题 A 手动设置高浏览量，再创建低互动问题 C
  const mysql = await import('file:///D:/agentCode/QA%E7%A4%BE%E5%8C%BA/backend/node_modules/mysql2/promise.js');
  const conn = await mysql.default.createConnection({ host: 'localhost', user: 'root', password: '123456', database: 'qa_community' });
  await conn.execute('UPDATE questions SET view_count = 500, like_count = 20 WHERE id = ?', [qA.id]);
  await conn.end();

  r = await api('POST', '/questions', {
    token: bob,
    body: { title: 'MySQL 索引失效的常见场景有哪些？', content: 'explain 显示全表扫描的常见原因？', tagIds: [4] },
  });
  const qC = r.json?.data?.question;
  check('创建低互动问题 C 201', r.status === 201);

  r = await api('GET', '/questions?sort=hot');
  check('hot 排序：高互动问题在前', r.json.data.items[0].id === qA.id && r.json.data.items[1].id === qC.id);

  // 24. 标签列表含问题数
  r = await api('GET', '/tags');
  const react = r.json.data.tags.find((t) => t.name === 'React');
  const mysqlTag = r.json.data.tags.find((t) => t.name === 'MySQL');
  check('标签问题数统计正确', react?.questionCount === 1 && mysqlTag?.questionCount === 1);

  // 清理：删除测试数据（保留 qA 供 UI 联调展示？删除 qC，保留 qA）
  await api('DELETE', `/questions/${qC.id}`, { token: bob });
  console.log('done');
}

main().catch((e) => {
  console.error('SCRIPT ERROR:', e);
  process.exit(1);
});
