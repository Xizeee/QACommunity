```
# AGENTS.md

# 问答社区项目 Agent 开发规范

## 1. 项目概述

本项目是一个问答社区系统，核心目标是为用户提供问题发布、回答、点赞、最佳答案采纳、标签筛选以及积分激励等功能。

系统采用前后端分离架构：

- 前端：React + TypeScript + Vite
- 后端：Node.js + Express
- 数据库：MySQL

核心业务包括：

- 用户注册、登录及用户信息管理
- 用户发布问题
- 用户回答问题
- 问题点赞
- 回答点赞
- 提问者采纳最佳答案
- 问题标签
- 按标签筛选问题
- 按最新、热门、未解决等条件排序
- 用户积分及积分流水
- 问题、回答及用户相关数据查询

Agent 在开发过程中必须以 `PRD.md`、`TECH_DESIGN.md` 和 `DATABASE_DESIGN.md` 作为项目需求、技术架构和数据库设计的主要依据。

---

# 2. Agent 核心工作原则

## 2.1 先理解，后修改

在修改代码之前，Agent 必须先理解当前项目：

1. 项目目录结构
2. 当前技术栈
3. 核心业务模块
4. 数据模型
5. API 结构
6. 前端页面及组件关系
7. 当前实现状态
8. 已存在的公共工具和基础设施

禁止在不了解现有实现的情况下直接大范围重构。

---

## 2.2 文档优先

项目文档具有明确优先级：

```text
PRD.md
   ↓
TECH_DESIGN.md
   ↓
DATABASE_DESIGN.md
   ↓
实际代码实现
```

Agent 必须遵循：

> 需求以 PRD 为准，技术实现以 TECH_DESIGN 为准，数据库结构以 DATABASE_DESIGN 为准。

如果发现代码与文档不一致：

1. 不要直接假设文档错误。
2. 先判断当前任务是否要求修改该部分。
3. 如果涉及需求或架构变更，应明确指出冲突。
4. 未获得明确要求时，不得擅自扩大修改范围。

------

# 3. 开发范围控制

## 3.1 严格按照任务开发

Agent 只实现用户当前要求的功能。

例如用户要求：

```
增加问题点赞功能
```

不得擅自增加：

- 收藏
- 评论
- 私信
- 通知
- 举报
- 关注
- 搜索引擎
- 推荐算法
- Redis
- Elasticsearch

除非这些内容已经存在于项目设计中，或者用户明确要求。

------

## 3.2 禁止过度设计

MVP 阶段保持架构简单。

未经明确要求，不得主动引入：

- 微服务
- 消息队列
- Redis
- Elasticsearch
- GraphQL
- Kubernetes
- 分布式事务
- 分库分表
- 复杂事件驱动架构

优先使用当前技术栈解决问题。

------

# 4. 项目结构规范

推荐保持前后端职责清晰。

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   └── ...
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   └── ...
│   └── ...
│
├── PRD.md
├── TECH_DESIGN.md
├── DATABASE_DESIGN.md
└── AGENTS.md
```

如果实际项目已经存在不同结构，Agent 应优先遵循现有项目结构，而不是为了符合上述示例强制重构。

------

# 5. 前端开发规范

## 5.1 技术要求

前端使用：

```
React
TypeScript
Vite
```

必须优先使用 TypeScript。

禁止在没有必要的情况下使用：

```
any
```

如果确实无法避免，应明确类型原因。

------

## 5.2 React 组件规范

组件应该保持单一职责。

例如：

```
QuestionList
QuestionCard
QuestionDetail
AnswerList
AnswerItem
TagList
LikeButton
PointBadge
```

避免创建一个包含大量业务逻辑的巨型组件。

例如不要出现：

```
QuestionPage.tsx
```

同时承担：

- API 请求
- 状态管理
- 表单验证
- 点赞逻辑
- 采纳逻辑
- UI 渲染
- 数据转换

应根据实际复杂度拆分职责。

------

# 6. 前端状态管理

组件局部状态优先使用 React 自身能力：

```
useState
useReducer
useEffect
```

只有跨组件、跨页面共享的数据才考虑使用全局状态管理。

不要为了简单的表单状态引入全局 Store。

------

# 7. API 调用规范

前端不得直接在大量组件中编写重复 HTTP 请求逻辑。

推荐：

```
components/pages
        ↓
services
        ↓
HTTP API
```

例如：

```
questionService
answerService
userService
tagService
likeService
pointService
```

具体命名根据项目实际结构调整。

------

# 8. TypeScript 类型规范

API 数据必须定义明确类型。

例如：

```
interface Question {
  id: number;
  title: string;
  content: string;
  status: QuestionStatus;
  likeCount: number;
  answerCount: number;
  viewCount: number;
}
```

状态应该优先使用联合类型或枚举：

```
type QuestionStatus = 'UNSOLVED' | 'SOLVED' | 'DELETED';
```

避免：

```
status: string;
```

导致类型约束丢失。

------

# 9. 后端开发规范

## 9.1 技术要求

后端使用：

```
Node.js
Express
MySQL
```

后端代码必须保持清晰的分层结构。

推荐：

```
Route
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Database
```

------

# 10. Controller 规范

Controller 负责：

- 接收 HTTP 请求
- 参数获取
- 调用 Service
- 返回 HTTP 响应

Controller 不应该承载复杂业务逻辑。

不推荐：

```
Controller
    ↓
查询数据库
    ↓
计算积分
    ↓
修改问题
    ↓
创建积分流水
    ↓
返回结果
```

推荐：

```
Controller
    ↓
QuestionService
    ↓
Repository
```

------

# 11. Service 规范

Service 是主要业务逻辑层。

例如：

```
QuestionService
AnswerService
LikeService
PointService
TagService
UserService
```

Service 负责：

- 业务规则判断
- 权限相关业务判断
- 事务组织
- 多个 Repository 协作
- 数据一致性处理

------

# 12. Repository 规范

Repository 负责数据库访问。

例如：

```
UserRepository
QuestionRepository
AnswerRepository
TagRepository
LikeRepository
PointTransactionRepository
```

Repository 不应该决定复杂业务规则。

例如：

```
是否允许采纳答案
```

属于 Service 层，而不是 Repository 层。

------

# 13. 数据库开发规范

数据库使用：

```
MySQL
InnoDB
utf8mb4
```

所有核心表必须遵循 `DATABASE_DESIGN.md`。

核心表：

```
users
questions
answers
tags
question_tags
likes
point_transactions
```

未经明确需求，不得随意修改核心数据模型。

------

# 14. 数据库字段规范

核心 ID 使用：

```
BIGINT UNSIGNED
```

时间字段使用：

```
DATETIME
```

统一使用：

```
created_at
updated_at
```

需要逻辑删除的实体使用：

```
deleted_at
```

------

# 15. 数据库索引规范

新增查询条件时，Agent 必须考虑是否需要索引。

重点查询包括：

```
问题列表
问题状态
问题创建时间
用户问题
用户回答
问题回答
标签筛选
点赞关系
积分流水
```

禁止为了“可能有用”而大量创建无意义索引。

------

# 16. 数据库事务规范

涉及多个数据修改的业务必须考虑事务。

例如发布问题：

```
创建问题
    +
关联标签
    +
增加积分
    +
创建积分流水
```

必须保证数据的一致性。

推荐：

```
BEGIN

创建 Question
创建 QuestionTag
增加 User.points
创建 PointTransaction

COMMIT
```

任意关键步骤失败：

```
ROLLBACK
```

------

# 17. 点赞功能规范

点赞必须通过 `likes` 表记录用户与目标之间的关系。

支持：

```
QUESTION
ANSWER
```

点赞记录必须保证：

```
同一个用户
+
同一个目标
+
同一种目标类型
```

只能存在一条记录。

必须依赖：

```
UNIQUE(user_id, target_type, target_id)
```

防止重复点赞。

------

# 18. 点赞统计规范

问题：

```
questions.like_count
```

回答：

```
answers.like_count
```

属于冗余统计字段。

点赞操作需要保证：

```
likes
```

与：

```
like_count
```

保持一致。

前端不得直接修改点赞数量。

------

# 19. 积分系统规范

用户当前积分保存在：

```
users.points
```

积分历史保存在：

```
point_transactions
```

两者必须保持一致。

积分变化必须创建对应流水。

例如：

```
用户回答问题
    ↓
users.points + N
    ↓
point_transactions
```

------

# 20. 积分幂等规范

积分操作必须具备幂等性。

使用：

```
idempotency_key
```

防止：

- 重复请求
- 网络重试
- 服务重试
- 并发请求

导致重复发放积分。

禁止在没有幂等保护的情况下直接发放积分。

------

# 21. 采纳答案规范

只有问题的提问者可以采纳答案。

采纳前必须验证：

```
当前用户 == question.user_id
```

同时验证：

```
answer.question_id == question.id
```

不得采纳其他问题的答案。

采纳成功后：

```
question.status = SOLVED
question.accepted_answer_id = answer.id
answer.status = ACCEPTED
```

同时按照积分规则处理积分。

------

# 22. 并发控制

涉及以下业务时必须考虑并发：

```
采纳答案
点赞
积分
统计数量
```

尤其是采纳答案。

必须避免：

```
请求 A → 采纳答案 A
请求 B → 采纳答案 B
```

最终出现多个答案同时被认为是最佳答案。

必要时使用数据库行锁：

```
SELECT ...
FROM questions
WHERE id = ?
FOR UPDATE;
```

------

# 23. API 错误处理

API 不应该直接返回数据库异常信息。

错误应该经过统一处理。

例如：

```
{
  "code": "QUESTION_NOT_FOUND",
  "message": "问题不存在"
}
```

禁止将：

```
SQL Error
数据库连接信息
服务器路径
堆栈信息
```

直接返回给前端。

------

# 24. 参数验证

所有来自客户端的数据都必须进行验证。

包括：

```
用户名
邮箱
密码
问题标题
问题内容
回答内容
标签
问题 ID
答案 ID
分页参数
排序参数
```

不能因为前端已经进行了校验，就跳过后端校验。

------

# 25. SQL 安全

禁止直接拼接用户输入构造 SQL。

错误：

```
const sql = `SELECT * FROM users WHERE id = ${id}`;
```

必须使用：

```
参数化查询
```

或 ORM / Query Builder 提供的安全机制。

------

# 26. 认证与权限

需要登录的操作必须经过认证。

至少包括：

```
发布问题
发布回答
点赞
取消点赞
采纳答案
修改自己的内容
删除自己的内容
```

权限判断必须在后端完成。

不能仅依赖前端隐藏按钮实现权限控制。

------

# 27. 内容权限

用户只能修改和删除属于自己的内容。

例如：

```
Question.user_id === currentUser.id
```

或者：

```
Answer.user_id === currentUser.id
```

管理员权限按照项目实际设计处理。

------

# 28. Markdown 内容

问题和回答内容支持 Markdown。

Markdown 渲染必须考虑 XSS 风险。

禁止未经处理直接将用户输入作为 HTML 插入页面。

前端渲染 Markdown 时应使用安全的 Markdown 解析 / Sanitization 方案。

------

# 29. 分页规范

问题列表和回答列表必须支持分页。

避免一次性加载大量数据。

推荐：

```
page
pageSize
```

或项目统一采用的分页方案。

必须对：

```
pageSize
```

设置最大值，避免恶意请求一次获取大量数据。

------

# 30. 排序规范

首页问题支持：

```
最新
热门
未解决
```

排序逻辑应集中管理。

不要在多个 Controller 或组件中重复实现排序规则。

例如：

```
sort = latest
sort = hot
sort = unsolved
```

具体热门算法按照项目已有设计实现。

如果文档没有明确算法，不得擅自引入复杂推荐算法。

------

# 31. 标签规范

标签使用：

```
tags
question_tags
```

实现多对多关系。

一个问题可以拥有多个标签。

一个标签可以关联多个问题。

标签名称必须唯一。

------

# 32. 删除规范

问题和回答采用逻辑删除。

删除后：

```
deleted_at IS NOT NULL
```

并设置对应状态：

```
DELETED
```

普通列表查询默认排除已删除数据。

------

# 33. Git 规范

提交应保持小而清晰。

推荐：

```
feat: add question creation
feat: add answer like
fix: fix answer acceptance
refactor: simplify question service
test: add question service tests
docs: update database design
```

一次提交尽量只解决一个明确问题。

禁止将大量无关修改混在一个提交中。

------

# 34. 代码风格

遵循项目已有 ESLint / Prettier 配置。

如果项目已经存在：

```
.eslintrc
eslint.config.*
.prettierrc
.prettierignore
```

必须优先遵循现有配置。

禁止为了个人习惯随意修改项目代码风格。

------

# 35. 命名规范

变量使用：

```
camelCase
```

类型 / 类 / React 组件：

```
PascalCase
```

数据库字段：

```
snake_case
```

例如：

```
questionId
QuestionCard
created_at
```

------

# 36. 注释规范

代码应该优先通过良好的命名表达意图。

不要为显而易见的代码添加大量注释。

需要注释时重点解释：

```
为什么这样做
```

而不是：

```
代码正在做什么
```

对于积分幂等、事务、并发控制等容易被误改的关键逻辑，应保留必要注释。

------

# 37. 测试要求

每次完成重要功能后，Agent 必须进行验证。

至少包括：

```
编译
类型检查
Lint
单元测试
接口测试
```

具体执行哪些命令，以项目实际配置为准。

------

# 38. 核心业务测试

必须重点测试：

### 用户

```
注册
登录
重复用户名
重复邮箱
错误密码
```

### 问题

```
创建问题
查询问题
修改问题
删除问题
标签关联
```

### 回答

```
创建回答
查询回答
修改回答
删除回答
```

### 点赞

```
问题点赞
回答点赞
取消点赞
重复点赞
```

### 采纳

```
提问者采纳
非提问者采纳
错误问题答案
重复采纳
```

### 积分

```
发布问题获得积分
发布回答获得积分
被采纳获得积分
重复请求不会重复获得积分
```

------

# 39. 修改代码后的验证流程

Agent 完成代码修改后，应按照以下顺序验证：

```
1. TypeScript 类型检查
        ↓
2. ESLint
        ↓
3. 单元测试
        ↓
4. 后端启动测试
        ↓
5. API 测试
        ↓
6. 前端构建
```

如果项目没有对应工具，则跳过不存在的步骤，但必须进行可执行的验证。

------

# 40. Bug 修复原则

发现 Bug 时：

```
复现问题
    ↓
定位原因
    ↓
确定影响范围
    ↓
最小修改
    ↓
验证修复
    ↓
检查回归
```

禁止看到错误后直接大规模重构。

------

# 41. 重构原则

只有在以下情况下才进行重构：

- 当前结构明显阻碍功能开发。
- 存在严重重复代码。
- 存在明显架构问题。
- 用户明确要求重构。

重构时必须：

```
保持现有功能不变
+
保持 API 兼容
+
保持数据库结构兼容
+
通过测试
```

------

# 42. 文件修改原则

修改前先确认：

```
文件是否存在
文件是否被其他模块使用
修改是否影响现有 API
修改是否影响数据库
修改是否影响前端调用
```

不要为了完成一个小需求创建大量重复文件。

------

# 43. Agent 执行任务流程

Agent 接收到开发任务后，应按照：

```
Step 1：理解任务
        ↓
Step 2：读取相关项目文档
        ↓
Step 3：检查项目结构
        ↓
Step 4：定位相关代码
        ↓
Step 5：分析依赖关系
        ↓
Step 6：制定最小实现方案
        ↓
Step 7：修改代码
        ↓
Step 8：运行测试
        ↓
Step 9：修复发现的问题
        ↓
Step 10：最终验证
```

------

# 44. 修改前必须检查的内容

如果任务涉及：

### 前端

检查：

```
页面
组件
路由
状态
API Service
TypeScript 类型
```

### 后端

检查：

```
Route
Controller
Service
Repository
Middleware
数据库模型
```

### 数据库

检查：

```
表
字段
索引
外键
事务
Migration
```

------

# 45. 禁止事项

Agent 禁止：

1. 擅自修改产品需求。
2. 擅自扩大开发范围。
3. 未确认现有代码就进行大规模重构。
4. 删除正在使用的功能。
5. 删除数据库数据。
6. 修改数据库结构但不更新 Migration。
7. 绕过后端权限检查。
8. 明文保存密码。
9. 拼接用户输入生成 SQL。
10. 将数据库异常直接返回给用户。
11. 使用 `any` 绕过 TypeScript 类型问题。
12. 为简单需求引入复杂基础设施。
13. 为了“优化”而修改无关代码。
14. 在没有测试的情况下声称功能已经完成。

------

# 46. 文档同步要求

当代码发生以下变化时，应同步检查相关文档：

```
API 发生变化
数据库结构发生变化
核心业务逻辑发生变化
项目技术架构发生变化
目录结构发生重大变化
```

如果变化属于需求层面，则需要更新：

```
PRD.md
```

如果属于技术架构，则需要更新：

```
TECH_DESIGN.md
```

如果属于数据库结构，则需要更新：

```
DATABASE_DESIGN.md
```

------

# 47. 完成任务的标准

Agent 不能仅以“代码已经修改”作为完成标准。

一个任务只有在以下条件基本满足时才可以认为完成：

```
需求实现
   +
代码符合项目结构
   +
类型检查通过
   +
Lint 通过
   +
相关测试通过
   +
核心业务流程验证
   +
没有明显回归问题
```

如果某项无法执行，应明确说明原因。

------

# 48. 输出规范

完成开发任务后，Agent 应简洁说明：

```
实现内容：
- xxx
- xxx

修改文件：
- xxx
- xxx

验证结果：
- TypeScript：通过
- ESLint：通过
- Tests：通过

注意事项：
- xxx
```

不要输出大量与任务无关的解释。

------

# 49. 最终原则

本项目开发遵循以下原则：

```
需求优先
    ↓
架构清晰
    ↓
职责分离
    ↓
最小修改
    ↓
数据一致
    ↓
安全优先
    ↓
测试验证
```

Agent 的核心目标不是写尽可能多的代码，而是：

> 在不破坏现有系统的前提下，以最小、清晰、可维护的实现完成明确需求，并保证核心业务的数据一致性与可验证性。
