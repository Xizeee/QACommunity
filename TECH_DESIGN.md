# 问答社区技术设计文档（TECH_DESIGN）

> 文档版本：V1.0
> 文档状态：Draft
> 对应产品文档：PRD.md
> 技术范围：MVP
> 前端：React + TypeScript + Vite
> 后端：Node.js + Express
> 数据库：MySQL

------

# 1. 技术设计目标

本技术设计文档用于定义问答社区 MVP 的技术实现方案。

核心目标：

1. 建立清晰、可维护的前后端项目架构。
2. 支持用户、问题、回答、标签、点赞、采纳、积分等核心业务。
3. 保证权限控制和数据一致性。
4. 保证点赞、采纳、积分等业务在重复请求和并发情况下不会产生错误数据。
5. 为后续评论、收藏、通知、举报、管理后台等功能预留合理扩展空间。
6. 保持技术实现与 `PRD.md` 中定义的产品行为一致。

------

# 2. 技术栈

## 2.1 前端

| 技术              | 版本建议     | 用途          |
| ----------------- | ------------ | ------------- |
| React             | 18+          | UI 框架       |
| TypeScript        | 5+           | 类型系统      |
| Vite              | 5+           | 构建工具      |
| React Router      | 6+           | 路由管理      |
| Axios             | 最新稳定版   | HTTP 请求     |
| Zustand           | 最新稳定版   | 全局状态管理  |
| React Hook Form   | 最新稳定版   | 表单管理      |
| Zod               | 最新稳定版   | 前端数据校验  |
| Markdown Renderer | 具体实现待定 | Markdown 渲染 |

### 前端技术原则

- 使用 TypeScript。
- 禁止使用 `any` 作为常规类型逃逸手段。
- 页面组件、业务组件和基础组件分层。
- API 请求统一封装。
- 服务端数据与 UI 状态分离。
- 表单校验与后端校验不能互相替代。
- 不在前端保存或计算可信业务数据。

------

# 3. 后端

| 技术                | 用途                                   |
| ------------------- | -------------------------------------- |
| Node.js             | JavaScript 运行时                      |
| Express             | HTTP 服务框架                          |
| TypeScript          | 后端类型系统                           |
| MySQL               | 关系型数据库                           |
| ORM / Query Builder | 数据访问层，具体方案待项目初始化时确定 |
| JWT / Session       | 身份认证方案，具体实现待确定           |
| bcrypt / Argon2     | 密码哈希                               |

后端采用分层架构：

```
Router
  ↓
Controller
  ↓
Service
  ↓
Repository / Data Access
  ↓
MySQL
```

核心业务逻辑必须位于 Service 层，不应堆积在 Controller 中。

------

# 4. 总体系统架构

```
┌──────────────────────────────┐
│          Browser             │
│                              │
│ React + TypeScript + Vite    │
└──────────────┬───────────────┘
               │ HTTPS / JSON
               ↓
┌──────────────────────────────┐
│         Express API          │
│                              │
│ ┌──────────────────────────┐ │
│ │ Authentication Middleware│ │
│ ├──────────────────────────┤ │
│ │ Validation Middleware    │ │
│ ├──────────────────────────┤ │
│ │ Controller               │ │
│ └────────────┬─────────────┘ │
│              ↓               │
│          Service             │
│              ↓               │
│        Repository            │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│            MySQL             │
│                              │
│ Users                        │
│ Questions                    │
│ Answers                      │
│ Tags                         │
│ Likes                        │
│ Points                       │
└──────────────────────────────┘
```

------

# 5. 前端项目结构

建议目录结构：

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── question/
│   │   ├── answer/
│   │   ├── tag/
│   │   └── user/
│   │
│   ├── layouts/
│   │   └── MainLayout.tsx
│   │
│   ├── pages/
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── QuestionDetail/
│   │   ├── AskQuestion/
│   │   ├── EditQuestion/
│   │   ├── Tags/
│   │   ├── TagQuestions/
│   │   ├── UserProfile/
│   │   ├── MyQuestions/
│   │   ├── MyAnswers/
│   │   └── MyPoints/
│   │
│   ├── hooks/
│   ├── stores/
│   ├── services/
│   │   ├── api/
│   │   └── http.ts
│   │
│   ├── types/
│   ├── schemas/
│   ├── utils/
│   ├── constants/
│   ├── router/
│   ├── App.tsx
│   └── main.tsx
│
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

------

# 6. 前端分层原则

## 6.1 Pages

负责：

- 页面布局。
- 页面级数据获取。
- 页面级状态。
- 页面级交互组合。

不负责复杂业务逻辑。

## 6.2 Components

负责：

- 可复用 UI。
- 单个业务区域。
- 用户交互。

例如：

```
QuestionCard
AnswerCard
TagList
LikeButton
AcceptAnswerButton
Pagination
EmptyState
ErrorState
```

## 6.3 Services

负责：

- API 请求。
- 请求参数。
- API 响应类型。

例如：

```
questionApi
answerApi
authApi
tagApi
userApi
pointApi
```

## 6.4 Stores

仅保存真正需要跨页面共享的客户端状态，例如：

```
当前用户
认证状态
必要的 UI 状态
```

不建议将所有服务端数据全部放入全局 Store。

------

# 7. 后端项目结构

建议：

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── question.controller.ts
│   │   ├── answer.controller.ts
│   │   ├── tag.controller.ts
│   │   ├── like.controller.ts
│   │   └── user.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── question.service.ts
│   │   ├── answer.service.ts
│   │   ├── tag.service.ts
│   │   ├── like.service.ts
│   │   └── point.service.ts
│   │
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── question.repository.ts
│   │   ├── answer.repository.ts
│   │   ├── tag.repository.ts
│   │   ├── like.repository.ts
│   │   └── point.repository.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── question.routes.ts
│   │   ├── answer.routes.ts
│   │   ├── tag.routes.ts
│   │   ├── like.routes.ts
│   │   └── user.routes.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   ├── schemas/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   ├── app.ts
│   └── server.ts
│
├── tests/
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

------

# 8. 后端分层职责

## 8.1 Router

负责：

- HTTP 路由定义。
- Middleware 组合。
- Controller 映射。

不包含业务逻辑。

## 8.2 Controller

负责：

- 获取 HTTP 参数。
- 调用 Service。
- 返回 HTTP 响应。

Controller 不直接操作数据库。

## 8.3 Service

负责：

- 核心业务逻辑。
- 权限判断。
- 状态转换。
- 事务控制。
- 积分业务。
- 点赞业务。
- 采纳业务。

## 8.4 Repository

负责：

- 数据库查询。
- 数据库写入。
- 数据库更新。
- 数据库删除。

Repository 不负责业务规则。

------

# 9. 数据库设计原则

数据库采用 MySQL。

设计原则：

1. 使用 InnoDB。
2. 主键统一采用 `BIGINT`。
3. 所有核心表包含创建时间。
4. 需要修改的数据包含更新时间。
5. 用户内容删除采用逻辑删除。
6. 业务关系通过外键或应用层约束保证一致性。
7. 点赞关系必须建立唯一约束。
8. 积分记录必须保留业务事件标识。
9. 高查询字段建立合理索引。
10. 不通过前端传入的数据直接更新统计字段。

------

# 10. 核心数据模型

核心实体：

```
User
 │
 ├── Question
 │      │
 │      ├── Answer
 │      │
 │      └── Tag
 │
 ├── Like
 │
 └── PointTransaction
```

------

# 11. users 表

```
users
├── id
├── username
├── email
├── password_hash
├── avatar
├── bio
├── role
├── points
├── created_at
└── updated_at
```

字段：

| 字段          | 类型         | 说明             |
| ------------- | ------------ | ---------------- |
| id            | BIGINT       | 主键             |
| username      | VARCHAR(20)  | 用户名           |
| email         | VARCHAR(...) | 邮箱             |
| password_hash | VARCHAR(...) | 密码哈希         |
| avatar        | VARCHAR(...) | 头像地址，可为空 |
| bio           | VARCHAR(...) | 个人简介，可为空 |
| role          | ENUM         | 用户角色         |
| points        | INT          | 当前积分         |
| created_at    | DATETIME     | 创建时间         |
| updated_at    | DATETIME     | 更新时间         |

约束：

```
email UNIQUE
username UNIQUE
points >= 0
```

------

# 12. questions 表

```
questions
├── id
├── user_id
├── title
├── content
├── status
├── view_count
├── like_count
├── answer_count
├── accepted_answer_id
├── created_at
├── updated_at
└── deleted_at
```

字段：

| 字段               | 类型         | 说明          |
| ------------------ | ------------ | ------------- |
| id                 | BIGINT       | 主键          |
| user_id            | BIGINT       | 作者 ID       |
| title              | VARCHAR(100) | 问题标题      |
| content            | TEXT         | Markdown 内容 |
| status             | ENUM         | 问题状态      |
| view_count         | INT          | 浏览次数      |
| like_count         | INT          | 点赞数量      |
| answer_count       | INT          | 回答数量      |
| accepted_answer_id | BIGINT       | 采纳答案 ID   |
| created_at         | DATETIME     | 创建时间      |
| updated_at         | DATETIME     | 更新时间      |
| deleted_at         | DATETIME     | 删除时间      |

状态：

```
UNSOLVED
SOLVED
DELETED
```

------

# 13. answers 表

```
answers
├── id
├── question_id
├── user_id
├── content
├── status
├── like_count
├── created_at
├── updated_at
└── deleted_at
```

字段：

| 字段        | 类型     | 说明          |
| ----------- | -------- | ------------- |
| id          | BIGINT   | 主键          |
| question_id | BIGINT   | 所属问题      |
| user_id     | BIGINT   | 作者          |
| content     | TEXT     | Markdown 内容 |
| status      | ENUM     | 回答状态      |
| like_count  | INT      | 点赞数量      |
| created_at  | DATETIME | 创建时间      |
| updated_at  | DATETIME | 更新时间      |
| deleted_at  | DATETIME | 删除时间      |

状态建议：

```
NORMAL
ACCEPTED
DELETED
```

------

# 14. tags 表

```
tags
├── id
├── name
├── created_at
└── updated_at
```

字段：

| 字段       | 类型         | 说明     |
| ---------- | ------------ | -------- |
| id         | BIGINT       | 主键     |
| name       | VARCHAR(...) | 标签名称 |
| created_at | DATETIME     | 创建时间 |
| updated_at | DATETIME     | 更新时间 |

约束：

```
name UNIQUE
```

------

# 15. question_tags 表

问题和标签属于多对多关系。

```
question_tags
├── question_id
└── tag_id
```

建立联合唯一约束：

```
UNIQUE(question_id, tag_id)
```

关系：

```
Question N ───── N Tag
```

------

# 16. likes 表

点赞需要同时支持问题和回答。

推荐采用统一目标模型：

```
likes
├── id
├── user_id
├── target_type
├── target_id
└── created_at
```

字段：

| 字段        | 类型     | 说明              |
| ----------- | -------- | ----------------- |
| id          | BIGINT   | 主键              |
| user_id     | BIGINT   | 点赞用户          |
| target_type | ENUM     | QUESTION / ANSWER |
| target_id   | BIGINT   | 目标 ID           |
| created_at  | DATETIME | 点赞时间          |

唯一约束：

```
UNIQUE(user_id, target_type, target_id)
```

该约束用于防止重复点赞。

由于 `target_id` 根据 `target_type` 指向不同业务表，数据库层面无法通过普通外键同时约束两个目标表，因此必须在 Service 层验证目标是否存在。

------

# 17. point_transactions 表

积分采用“当前余额 + 积分流水”的设计。

```
point_transactions
├── id
├── user_id
├── amount
├── type
├── reference_type
├── reference_id
├── idempotency_key
└── created_at
```

字段：

| 字段            | 类型     | 说明         |
| --------------- | -------- | ------------ |
| id              | BIGINT   | 主键         |
| user_id         | BIGINT   | 用户         |
| amount          | INT      | 积分变化量   |
| type            | VARCHAR  | 积分行为     |
| reference_type  | VARCHAR  | 关联业务类型 |
| reference_id    | BIGINT   | 关联业务 ID  |
| idempotency_key | VARCHAR  | 幂等键       |
| created_at      | DATETIME | 创建时间     |

积分行为：

```
QUESTION_CREATED
ANSWER_CREATED
QUESTION_LIKED
ANSWER_LIKED
ANSWER_ACCEPTED
```

------

# 18. 实体关系

```
User
 │
 ├───────────────┐
 │               │
 ↓               ↓
Question        Answer
 │               │
 │               └──────── User
 │
 ├── QuestionTag ── Tag
 │
 └── acceptedAnswer ── Answer


User
 │
 ├── Like ── Question
 │
 ├── Like ── Answer
 │
 └── PointTransaction
```

------

# 19. 数据库索引

核心索引建议：

## users

```
UNIQUE(email)
UNIQUE(username)
```

## questions

```
INDEX(user_id)
INDEX(status, created_at)
INDEX(created_at)
INDEX(like_count)
```

## answers

```
INDEX(question_id, created_at)
INDEX(user_id)
INDEX(question_id, like_count)
```

## tags

```
UNIQUE(name)
```

## question_tags

```
PRIMARY KEY(question_id, tag_id)
INDEX(tag_id, question_id)
```

## likes

```
UNIQUE(user_id, target_type, target_id)
INDEX(target_type, target_id)
```

## point_transactions

```
INDEX(user_id, created_at)
UNIQUE(idempotency_key)
```

------

# 20. 数据统计字段

问题：

```
view_count
like_count
answer_count
```

回答：

```
like_count
```

这些字段属于冗余统计字段，用于减少列表查询时的聚合成本。

更新必须由后端控制。

例如点赞问题：

```
创建 Like
    ↓
questions.like_count + 1
```

取消点赞：

```
删除 Like
    ↓
questions.like_count - 1
```

必须保证关系数据与统计数据保持一致。

------

# 21. 认证架构

认证流程：

```
登录
 ↓
验证邮箱
 ↓
验证密码
 ↓
创建认证凭证
 ↓
返回客户端
```

后续请求：

```
Client
 ↓
Authentication
 ↓
Auth Middleware
 ↓
解析当前用户
 ↓
req.user
 ↓
Controller
```

认证凭证具体采用 JWT 或 Session，应在项目初始化阶段根据部署环境确定。

无论采用何种方案：

> 用户身份必须由服务端确定，不能信任客户端提交的 `userId`。

------

# 22. 密码安全

密码不得明文保存。

注册：

```
Plain Password
       ↓
Password Hash
       ↓
Database
```

登录：

```
Plain Password
       ↓
Compare Hash
       ↓
Success / Failure
```

密码哈希算法使用：

```
Argon2
```

或项目依赖环境允许时使用：

```
bcrypt
```

禁止：

```
MD5
SHA1
明文密码
```

------

# 23. API 分层

API 基础路径：

```
/api/v1
```

模块：

```
/api/v1/auth
/api/v1/users
/api/v1/questions
/api/v1/answers
/api/v1/tags
/api/v1/likes
/api/v1/points
```

详细 API Request / Response 定义属于 `API_SPEC.md`，本技术设计仅定义接口职责和架构边界。

------

# 24. API 设计原则

所有 API 遵循：

```
RESTful
JSON
HTTP Status Code
统一错误格式
```

成功响应统一结构建议：

```
{
  "success": true,
  "data": {}
}
```

错误响应：

```
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  }
}
```

错误码必须稳定，前端不应依赖错误消息文本进行业务判断。

------

# 25. 认证 API

职责：

```
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

负责：

- 注册。
- 登录。
- 退出。
- 获取当前用户。

------

# 26. 问题 API

职责：

```
GET    /questions
GET    /questions/:id
POST   /questions
PATCH  /questions/:id
DELETE /questions/:id
```

列表需要支持：

```
sort=latest
sort=hot
sort=unresolved
```

以及：

```
page
pageSize
tag
keyword
```

具体参数规范由 API 文档定义。

------

# 27. 回答 API

职责：

```
POST   /questions/:questionId/answers
PATCH  /answers/:id
DELETE /answers/:id
```

采纳答案：

```
POST /questions/:questionId/accept-answer
```

采纳操作必须由 Service 层完成事务处理。

------

# 28. 点赞 API

可以采用统一接口：

```
POST   /likes
DELETE /likes
```

请求中包含：

```
targetType
targetId
```

后端验证：

```
targetType
    ↓
QUESTION / ANSWER
    ↓
验证 targetId
    ↓
执行点赞
```

------

# 29. 标签 API

职责：

```
GET /tags
GET /tags/:id/questions
```

标签数据主要用于：

- 标签列表。
- 标签筛选。
- 问题创建时选择标签。

------

# 30. 用户 API

职责：

```
GET /users/:id
GET /users/:id/questions
GET /users/:id/answers
```

当前用户相关：

```
GET /me/questions
GET /me/answers
GET /me/points
```

------

# 31. Service 层核心业务

## 31.1 创建问题

```
QuestionService.createQuestion()
```

流程：

```
验证用户
 ↓
验证标题
 ↓
验证内容
 ↓
验证标签
 ↓
创建 Question
 ↓
建立 QuestionTag
 ↓
增加用户积分
 ↓
创建 PointTransaction
 ↓
Commit
```

问题创建和对应积分必须处于同一个事务中。

------

# 32. 创建回答

```
AnswerService.createAnswer()
```

流程：

```
验证用户
 ↓
查询问题
 ↓
检查问题是否存在
 ↓
检查问题是否删除
 ↓
验证回答内容
 ↓
创建 Answer
 ↓
更新 answer_count
 ↓
增加回答积分
 ↓
创建积分流水
 ↓
Commit
```

------

# 33. 点赞业务

```
LikeService.like()
```

流程：

```
验证登录
 ↓
验证 targetType
 ↓
验证目标存在
 ↓
检查目标是否属于当前用户
 ↓
检查 Like 是否存在
 ↓
创建 Like
 ↓
更新 like_count
 ↓
发放点赞积分
 ↓
Commit
```

重复点赞：

```
UNIQUE(user_id, target_type, target_id)
```

作为数据库最终防线。

------

# 34. 取消点赞

```
LikeService.unlike()
```

流程：

```
验证登录
 ↓
查询 Like
 ↓
不存在 → 幂等成功
 ↓
存在
 ↓
删除 Like
 ↓
更新 like_count
 ↓
Commit
```

按照 PRD：

> 取消点赞不会追回已经获得的积分。

------

# 35. 采纳答案事务

采纳答案是 MVP 最重要的事务之一。

```
BEGIN
  ↓
锁定问题
  ↓
验证问题作者
  ↓
验证问题状态
  ↓
验证答案属于该问题
  ↓
更新 Answer.status = ACCEPTED
  ↓
更新 Question.accepted_answer_id
  ↓
更新 Question.status = SOLVED
  ↓
创建积分流水
  ↓
增加回答者积分
  ↓
COMMIT
```

需要使用数据库事务。

问题锁定可以避免两个请求同时采纳不同答案。

最终数据库必须保证：

```
一个问题
    ↓
最多一个 accepted_answer
```

------

# 36. 积分系统实现

积分系统采用：

```
User.points
+
PointTransaction
```

结构。

其中：

```
users.points
```

用于快速读取当前积分。

```
point_transactions
```

用于：

- 审计。
- 展示历史。
- 防止重复发放。
- 问题排查。

------

# 37. 积分事务

例如回答被采纳：

```
BEGIN
    ↓
检查 idempotency_key
    ↓
不存在
    ↓
创建 PointTransaction(+20)
    ↓
users.points + 20
    ↓
COMMIT
```

如果已经存在：

```
已存在
    ↓
不重复发放
```

------

# 38. 积分幂等键

积分事件必须生成稳定的幂等键。

例如：

```
QUESTION_CREATED:1001
ANSWER_CREATED:2001
ANSWER_ACCEPTED:2001
QUESTION_LIKED:1001:USER:10
ANSWER_LIKED:2001:USER:10
```

最终存储在：

```
point_transactions.idempotency_key
```

并建立唯一索引。

------

# 39. 热门排序实现

热门问题需要综合：

```
点赞
回答
浏览
发布时间
```

技术实现可以采用时间衰减算法。

概念模型：

```
hot_score =
interaction_score × freshness_factor
```

其中：

```
interaction_score
=
like_weight × like_count
+
answer_weight × answer_count
+
view_weight × view_count
```

最终权重和衰减参数需要通过实际数据进行调整。

MVP 阶段可以先采用数据库计算的简化方案，不需要引入独立推荐系统。

------

# 40. 最新排序

```
ORDER BY created_at DESC
```

必须使用数据库索引支持。

推荐：

```
INDEX(status, created_at)
```

------

# 41. 未解决排序

过滤：

```
status = UNSOLVED
```

然后：

```
ORDER BY created_at DESC
```

推荐使用：

```
INDEX(status, created_at)
```

------

# 42. 搜索实现

MVP 阶段不引入 Elasticsearch 等独立搜索服务。

可以采用 MySQL 查询实现：

```
title
content
tag
```

根据实际数据规模决定是否使用：

```
LIKE
FULLTEXT
```

搜索服务应保持独立：

```
SearchService
```

以便未来替换搜索引擎。

------

# 43. Markdown 安全处理

用户提交的 Markdown 属于不可信输入。

后端或前端渲染时必须进行：

```
Markdown Parse
      ↓
HTML Sanitization
      ↓
Safe HTML
      ↓
Render
```

必须防止：

```
<script>
javascript:
恶意 HTML
XSS Payload
```

不能直接将未经清洗的用户 Markdown 转换成 HTML 后插入 DOM。

------

# 44. 权限控制

权限控制分为：

```
Authentication
Authorization
```

Authentication：

> 当前是谁？

Authorization：

> 当前用户是否有权执行这个操作？

例如编辑问题：

```
当前用户
    ↓
查询问题
    ↓
question.user_id === currentUser.id
    ↓
允许编辑
```

不能只依赖：

```
前端是否显示编辑按钮
```

------

# 45. 删除策略

问题和回答使用逻辑删除。

例如：

```
deleted_at IS NULL
```

表示正常。

删除：

```
deleted_at = CURRENT_TIMESTAMP
```

问题状态同时：

```
DELETED
```

查询公开数据时必须默认过滤：

```
deleted_at IS NULL
```

------

# 46. 数据一致性

以下数据必须保持一致：

```
Question.answer_count
        ↕
Answers
Question.like_count
        ↕
Likes
Answer.like_count
        ↕
Likes
User.points
        ↕
PointTransactions
```

关键操作使用事务。

------

# 47. 并发控制

重点防护场景：

## 点赞并发

使用：

```
UNIQUE(user_id, target_type, target_id)
```

防止重复点赞。

## 采纳并发

使用：

```
Transaction
+
Row Lock
```

确保一个问题只能采纳一个答案。

## 积分并发

使用：

```
Transaction
+
Idempotency Key
+
Unique Constraint
```

防止重复发放。

------

# 48. 浏览量处理

用户进入问题详情时：

```
view_count + 1
```

MVP 阶段可以直接在服务端更新。

后续如果访问量增加，可以考虑：

```
Redis
+
异步批量更新
```

但 MVP 不引入 Redis。

------

# 49. 前端数据请求策略

问题列表：

```
GET /questions
```

页面维护：

```
loading
data
error
pagination
```

问题详情：

```
GET /questions/:id
```

回答：

```
GET /questions/:id/answers
```

点赞状态可以通过当前用户与目标之间的关系获得。

------

# 50. 前端状态分类

建议分为：

```
Server State
Client State
Form State
UI State
```

Server State：

```
问题
回答
标签
用户信息
积分
```

Client State：

```
认证用户
必要的全局状态
```

Form State：

```
提问表单
回答表单
登录表单
注册表单
```

UI State：

```
Modal
Dropdown
Loading
Toast
```

避免把所有状态全部放进 Zustand。

------

# 51. 错误处理

后端统一错误处理中间件：

```
Request
 ↓
Route
 ↓
Controller
 ↓
Service
 ↓
throw Error
 ↓
Error Middleware
 ↓
HTTP Response
```

业务错误应使用明确错误码，例如：

```
AUTH_REQUIRED
INVALID_CREDENTIALS
QUESTION_NOT_FOUND
ANSWER_NOT_FOUND
FORBIDDEN
ALREADY_LIKED
CANNOT_LIKE_OWN_CONTENT
QUESTION_ALREADY_SOLVED
INVALID_TAG
```

------

# 52. 日志

后端至少记录：

- HTTP 请求。
- 错误。
- 关键业务异常。
- 数据库异常。

日志不得输出：

```
密码
Token
敏感认证信息
```

生产环境应避免输出完整用户隐私数据。

------

# 53. 配置管理

环境变量：

```
NODE_ENV
PORT
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
AUTH_SECRET
```

开发环境：

```
.env
```

必须提供：

```
.env.example
```

禁止将真实密码、Secret、Token 提交到 Git。

------

# 54. 前后端通信规范

统一使用：

```
HTTPS
JSON
UTF-8
```

API 使用：

```
Content-Type: application/json
```

列表响应需要包含分页信息，例如：

```
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

------

# 55. 分页实现

MVP 使用传统分页：

```
page
pageSize
```

后端转换：

```
offset = (page - 1) * pageSize
```

默认：

```
page = 1
pageSize = 20
```

必须限制最大：

```
pageSize <= 100
```

防止恶意请求一次获取大量数据。

------

# 56. 输入验证

前端：

```
Zod / React Hook Form
```

后端：

```
Request Schema Validation
```

后端必须重新验证。

验证内容包括：

```
类型
长度
格式
枚举值
ID
分页参数
标签数量
```

------

# 57. 安全设计

系统至少需要考虑：

```
SQL Injection
XSS
CSRF
Authentication Bypass
Authorization Bypass
Brute Force
Parameter Tampering
Duplicate Submission
```

数据库访问必须使用参数化查询或 ORM 安全机制。

------

# 58. CORS

开发环境允许前端开发服务器访问后端 API。

生产环境必须限制允许来源：

```
ALLOWED_ORIGINS
```

禁止生产环境使用：

```
Access-Control-Allow-Origin: *
```

作为默认配置。

------

# 59. API 幂等性

以下操作需要特别考虑幂等：

```
点赞
取消点赞
采纳答案
积分发放
问题提交
回答提交
```

数据库唯一约束和业务幂等机制共同保证。

------

# 60. 数据库事务边界

以下操作必须使用事务：

### 创建问题

```
Question
+
QuestionTag
+
PointTransaction
+
User.points
```

### 创建回答

```
Answer
+
Question.answer_count
+
PointTransaction
+
User.points
```

### 点赞

```
Like
+
target.like_count
+
PointTransaction
+
User.points
```

### 取消点赞

```
Like
+
target.like_count
```

### 采纳答案

```
Answer
+
Question
+
PointTransaction
+
User.points
```

------

# 61. 测试策略

测试分为：

```
Unit Test
Integration Test
API Test
E2E Test
```

------

# 62. Unit Test

重点测试 Service：

```
QuestionService
AnswerService
LikeService
PointService
AuthService
```

例如：

```
不能点赞自己的问题
不能重复点赞
不能重复采纳
采纳后问题变为 SOLVED
积分不能重复发放
```

------

# 63. Integration Test

重点验证：

```
Service
+
Repository
+
MySQL
```

测试：

- 创建问题。
- 创建回答。
- 点赞。
- 取消点赞。
- 采纳。
- 积分。
- 删除。

------

# 64. API Test

验证：

```
HTTP Request
    ↓
Middleware
    ↓
Controller
    ↓
Service
    ↓
Response
```

重点覆盖：

- 正常请求。
- 参数错误。
- 未登录。
- 无权限。
- 数据不存在。
- 重复操作。

------

# 65. E2E 测试

至少覆盖完整业务闭环：

```
注册
 ↓
登录
 ↓
发布问题
 ↓
其他用户回答
 ↓
点赞回答
 ↓
提问者采纳答案
 ↓
验证问题状态
 ↓
验证回答状态
 ↓
验证积分
```

------

# 66. 前端测试重点

需要测试：

- 路由。
- 登录状态。
- 表单校验。
- 问题列表。
- 问题详情。
- 回答。
- 点赞。
- 采纳。
- Loading。
- Empty。
- Error。
- 权限 UI。

------

# 67. 数据库迁移

数据库结构必须通过 Migration 管理。

禁止：

> 直接手动修改生产数据库结构而不记录迁移。

Migration 应保持：

```
001_create_users
002_create_questions
003_create_answers
004_create_tags
005_create_question_tags
006_create_likes
007_create_point_transactions
```

实际编号根据开发顺序调整。

------

# 68. Seed 数据

开发环境提供基础 Seed 数据。

至少包含：

```
测试用户
测试问题
测试回答
测试标签
```

方便开发和测试。

测试数据必须与生产数据隔离。

------

# 69. 开发环境

推荐：

```
Node.js
MySQL
npm / pnpm
Git
```

本地服务：

```
Frontend
http://localhost:5173

Backend
http://localhost:3000

MySQL
localhost:3306
```

具体端口可通过环境变量配置。

------

# 70. Git 分支建议

建议采用：

```
main
develop
feature/*
fix/*
```

功能开发：

```
feature/question
feature/answer
feature/auth
feature/like
feature/point
```

提交信息保持清晰。

例如：

```
feat: implement question creation
feat: add answer acceptance
fix: prevent duplicate likes
fix: correct point transaction
```

------

# 71. 开发顺序

建议按照业务依赖进行：

```
1. 项目初始化
       ↓
2. 数据库与 Migration
       ↓
3. 用户认证
       ↓
4. 问题
       ↓
5. 回答
       ↓
6. 标签
       ↓
7. 点赞
       ↓
8. 采纳
       ↓
9. 积分
       ↓
10. 搜索与排序
       ↓
11. 用户中心
       ↓
12. 测试
       ↓
13. 性能与安全检查
```

------

# 72. MVP 技术边界

MVP 阶段明确不引入：

```
Redis
Elasticsearch
Kafka
RabbitMQ
微服务
Kubernetes
独立推荐服务
独立搜索服务
分布式数据库
```

除非实际开发过程中出现明确的技术需求，否则保持：

```
React
+
Express
+
MySQL
```

的简单架构。

------

# 73. 扩展设计

未来功能可以在现有模块上扩展：

```
评论
   ↓
CommentService

收藏
   ↓
FavoriteService

通知
   ↓
NotificationService

举报
   ↓
ReportService

审核
   ↓
ModerationService
```

扩展时不得破坏现有核心业务。

------

# 74. 技术风险

## 74.1 积分重复发放

风险：

```
网络重试
并发请求
重复提交
```

解决：

```
Idempotency Key
+
Unique Constraint
+
Transaction
```

## 74.2 采纳并发

风险：

```
同时采纳两个答案
```

解决：

```
Transaction
+
Row Lock
```

## 74.3 点赞数量不一致

风险：

```
Like 关系存在
但 like_count 未更新
```

解决：

```
Transaction
+
统计字段统一由 Service 更新
```

## 74.4 XSS

风险：

```
Markdown → HTML
```

解决：

```
Markdown Parser
+
HTML Sanitizer
```

------

# 75. 技术验收标准

## 架构

- 

  前后端职责清晰。

- 

  Controller 不直接访问数据库。

- 

  核心业务逻辑位于 Service。

- 

  Repository 负责数据访问。

- 

  API 使用统一错误格式。

## 数据库

- 

  核心表结构完整。

- 

  点赞存在唯一约束。

- 

  标签关系存在唯一约束。

- 

  积分存在幂等约束。

- 

  关键查询存在必要索引。

- 

  删除采用逻辑删除。

- 

  数据库结构通过 Migration 管理。

## 业务一致性

- 

  问题创建和积分处于同一事务。

- 

  回答创建和积分处于同一事务。

- 

  点赞和点赞积分处于同一事务。

- 

  采纳答案和采纳积分处于同一事务。

- 

  一个问题最多一个采纳答案。

- 

  积分不会重复发放。

## 安全

- 

  密码不会明文存储。

- 

  API 权限由后端验证。

- 

  参数经过后端校验。

- 

  SQL 使用参数化查询或安全 ORM。

- 

  Markdown 内容经过安全处理。

- 

  Secret 不提交 Git。

- 

  敏感信息不写入日志。

## 测试

- 

  核心 Service 有单元测试。

- 

  核心 API 有集成测试。

- 

  核心业务闭环存在 E2E 测试。

- 

  并发场景经过验证。

- 

  重复请求经过验证。

------

# 76. 技术设计原则总结

本项目技术实现遵循以下原则：

```
简单优先
    ↓
模块清晰
    ↓
业务逻辑集中
    ↓
数据一致性优先
    ↓
安全优先
    ↓
可测试
    ↓
可扩展
```

MVP 阶段不追求复杂架构，而是优先保证核心问答业务稳定运行。

最终技术架构保持：

```
React + TypeScript + Vite
            │
            │ HTTP / JSON
            ↓
      Node.js + Express
            │
            ↓
          MySQL
```

围绕以下核心领域进行模块化：

```
Auth
Questions
Answers
Tags
Likes
Points
Users
```

并通过：

```
Service Layer
+
Database Transaction
+
Unique Constraint
+
Authorization
+
Automated Tests
```

保证问答社区 MVP 的核心业务正确性、数据一致性和可维护性。