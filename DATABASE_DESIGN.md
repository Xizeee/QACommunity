# DATABASE_DESIGN.md

## 1. 文档概述

### 1.1 文档目的

本文档用于定义问答社区项目的数据库设计方案，为数据库表结构、字段、索引、约束、实体关系及数据一致性提供统一的实现依据。

本文档基于项目 `PRD.md` 与 `TECH_DESIGN.md` 中定义的 MVP 功能和技术架构设计。

### 1.2 数据库技术

| 项目     | 方案                |
| -------- | ------------------- |
| 数据库   | MySQL               |
| 存储引擎 | InnoDB              |
| 字符集   | utf8mb4             |
| 排序规则 | utf8mb4_unicode_ci  |
| 主键     | BIGINT              |
| 时间类型 | DATETIME            |
| 数据访问 | ORM / Query Builder |
| 数据迁移 | Migration           |

### 1.3 数据库设计目标

数据库需要支持以下核心业务：

- 用户注册、登录及用户信息。
- 用户发布问题。
- 用户回答问题。
- 问题与标签关联。
- 问题和回答点赞。
- 提问者采纳最佳答案。
- 问题状态管理。
- 用户积分及积分流水。
- 问题列表排序。
- 标签筛选。
- 用户的问题、回答及积分记录查询。

------

# 2. 数据库总体模型

系统核心实体如下：

```
                    ┌──────────────┐
                    │    users     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ↓            ↓            ↓
        ┌──────────┐ ┌──────────┐ ┌───────────────┐
        │ questions│ │  answers │ │point_transactions│
        └────┬─────┘ └────┬─────┘ └───────────────┘
             │            │
             │            │
             ↓            ↓
      ┌────────────┐   ┌─────────┐
      │question_tags│  │  likes  │
      └──────┬─────┘   └────┬────┘
             │              │
             ↓              │
         ┌────────┐         │
         │  tags  │         │
         └────────┘         │
                            │
                            └── Question / Answer
```

核心关系：

```
User 1 ── N Question
User 1 ── N Answer

Question 1 ── N Answer

Question N ── N Tag
Question 1 ── N QuestionTag

User N ── N Question
User N ── N Answer
        （通过 Likes）

User 1 ── N PointTransaction
```

------

# 3. 数据库表清单

MVP 阶段包含以下核心表：

| 表名                 | 说明          |
| -------------------- | ------------- |
| `users`              | 用户          |
| `questions`          | 问题          |
| `answers`            | 回答          |
| `tags`               | 标签          |
| `question_tags`      | 问题-标签关联 |
| `likes`              | 点赞          |
| `point_transactions` | 积分流水      |

------

# 4. users 用户表

## 4.1 表说明

`users` 用于保存系统用户基础信息、认证信息、角色以及当前积分。

## 4.2 表结构

```
CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) NULL,
    bio VARCHAR(500) NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    points INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email),

    CONSTRAINT chk_users_points
        CHECK (points >= 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

## 4.3 字段说明

| 字段            | 类型            | NULL | 默认值            | 说明     |
| --------------- | --------------- | ---- | ----------------- | -------- |
| `id`            | BIGINT UNSIGNED | NO   | AUTO_INCREMENT    | 用户 ID  |
| `username`      | VARCHAR(20)     | NO   | -                 | 用户名   |
| `email`         | VARCHAR(255)    | NO   | -                 | 邮箱     |
| `password_hash` | VARCHAR(255)    | NO   | -                 | 密码哈希 |
| `avatar`        | VARCHAR(500)    | YES  | NULL              | 头像地址 |
| `bio`           | VARCHAR(500)    | YES  | NULL              | 个人简介 |
| `role`          | ENUM            | NO   | USER              | 用户角色 |
| `points`        | INT             | NO   | 0                 | 当前积分 |
| `created_at`    | DATETIME        | NO   | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at`    | DATETIME        | NO   | CURRENT_TIMESTAMP | 更新时间 |

## 4.4 约束

```
username 唯一
email 唯一
points >= 0
```

密码字段只保存密码哈希，不保存原始密码。

------

# 5. questions 问题表

## 5.1 表说明

`questions` 用于保存用户发布的问题。

## 5.2 表结构

```
CREATE TABLE questions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('UNSOLVED', 'SOLVED', 'DELETED')
        NOT NULL DEFAULT 'UNSOLVED',
    view_count INT UNSIGNED NOT NULL DEFAULT 0,
    like_count INT UNSIGNED NOT NULL DEFAULT 0,
    answer_count INT UNSIGNED NOT NULL DEFAULT 0,
    accepted_answer_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    KEY idx_questions_user_id (user_id),
    KEY idx_questions_status_created_at (status, created_at),
    KEY idx_questions_created_at (created_at),
    KEY idx_questions_like_count (like_count),

    CONSTRAINT fk_questions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

## 5.3 字段说明

| 字段                 | 类型            | NULL | 默认值            | 说明          |
| -------------------- | --------------- | ---- | ----------------- | ------------- |
| `id`                 | BIGINT UNSIGNED | NO   | AUTO_INCREMENT    | 问题 ID       |
| `user_id`            | BIGINT UNSIGNED | NO   | -                 | 提问用户      |
| `title`              | VARCHAR(100)    | NO   | -                 | 问题标题      |
| `content`            | TEXT            | NO   | -                 | Markdown 内容 |
| `status`             | ENUM            | NO   | UNSOLVED          | 问题状态      |
| `view_count`         | INT UNSIGNED    | NO   | 0                 | 浏览次数      |
| `like_count`         | INT UNSIGNED    | NO   | 0                 | 点赞数量      |
| `answer_count`       | INT UNSIGNED    | NO   | 0                 | 回答数量      |
| `accepted_answer_id` | BIGINT UNSIGNED | YES  | NULL              | 已采纳答案 ID |
| `created_at`         | DATETIME        | NO   | CURRENT_TIMESTAMP | 创建时间      |
| `updated_at`         | DATETIME        | NO   | CURRENT_TIMESTAMP | 更新时间      |
| `deleted_at`         | DATETIME        | YES  | NULL              | 删除时间      |

## 5.4 状态

```
UNSOLVED
    ↓
SOLVED
```

删除：

```
UNSOLVED / SOLVED
    ↓
DELETED
```

------

# 6. answers 回答表

## 6.1 表说明

`answers` 保存用户针对问题提交的回答。

## 6.2 表结构

```
CREATE TABLE answers (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    status ENUM('NORMAL', 'ACCEPTED', 'DELETED')
        NOT NULL DEFAULT 'NORMAL',
    like_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    KEY idx_answers_question_created_at
        (question_id, created_at),

    KEY idx_answers_user_id
        (user_id),

    KEY idx_answers_question_like_count
        (question_id, like_count),

    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id),

    CONSTRAINT fk_answers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

## 6.3 字段说明

| 字段          | 类型            | NULL | 默认值            | 说明     |
| ------------- | --------------- | ---- | ----------------- | -------- |
| `id`          | BIGINT UNSIGNED | NO   | AUTO_INCREMENT    | 回答 ID  |
| `question_id` | BIGINT UNSIGNED | NO   | -                 | 所属问题 |
| `user_id`     | BIGINT UNSIGNED | NO   | -                 | 回答用户 |
| `content`     | TEXT            | NO   | -                 | 回答内容 |
| `status`      | ENUM            | NO   | NORMAL            | 回答状态 |
| `like_count`  | INT UNSIGNED    | NO   | 0                 | 点赞数量 |
| `created_at`  | DATETIME        | NO   | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at`  | DATETIME        | NO   | CURRENT_TIMESTAMP | 更新时间 |
| `deleted_at`  | DATETIME        | YES  | NULL              | 删除时间 |

------

# 7. tags 标签表

## 7.1 表说明

`tags` 保存系统中的问题标签。

## 7.2 表结构

```
CREATE TABLE tags (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_tags_name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

## 7.3 字段说明

| 字段         | 类型            | NULL | 默认值            | 说明     |
| ------------ | --------------- | ---- | ----------------- | -------- |
| `id`         | BIGINT UNSIGNED | NO   | AUTO_INCREMENT    | 标签 ID  |
| `name`       | VARCHAR(50)     | NO   | -                 | 标签名称 |
| `created_at` | DATETIME        | NO   | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME        | NO   | CURRENT_TIMESTAMP | 更新时间 |

标签名称必须唯一。

------

# 8. question_tags 问题标签关联表

## 8.1 表说明

由于一个问题可以拥有多个标签，一个标签也可以关联多个问题，因此采用中间表实现多对多关系。

## 8.2 表结构

```
CREATE TABLE question_tags (
    question_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (question_id, tag_id),

    KEY idx_question_tags_tag_question
        (tag_id, question_id),

    CONSTRAINT fk_question_tags_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_question_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

## 8.3 关系

```
questions
    │
    │ 1:N
    ↓
question_tags
    ↑
    │ N:1
    │
tags
```

联合主键：

```
PRIMARY KEY(question_id, tag_id)
```

保证同一个问题不能重复关联同一个标签。

------

# 9. likes 点赞表

## 9.1 表说明

`likes` 用于保存用户对问题或回答的点赞关系。

由于问题和回答都支持点赞，因此采用多态关联：

```
target_type
target_id
```

## 9.2 表结构

```
CREATE TABLE likes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    target_type ENUM('QUESTION', 'ANSWER') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_likes_user_target
        (user_id, target_type, target_id),

    KEY idx_likes_target
        (target_type, target_id),

    KEY idx_likes_user_id
        (user_id),

    CONSTRAINT fk_likes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

## 9.3 点赞目标

```
target_type = QUESTION
target_id   = questions.id
```

或者：

```
target_type = ANSWER
target_id   = answers.id
```

由于 MySQL 普通外键无法让 `target_id` 同时指向 `questions.id` 和 `answers.id`，目标实体必须由 Service 层进行存在性验证。

## 9.4 防重复点赞

核心约束：

```
UNIQUE(user_id, target_type, target_id)
```

例如：

```
用户 100
问题 200
```

只能存在：

```
100 + QUESTION + 200
```

这一条点赞记录。

------

# 10. point_transactions 积分流水表

## 10.1 表说明

`point_transactions` 保存用户积分变化记录。

系统采用：

```
users.points
+
point_transactions
```

的设计。

其中 `users.points` 保存当前余额，`point_transactions` 保存积分变化历史。

## 10.2 表结构

```
CREATE TABLE point_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    amount INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id BIGINT UNSIGNED NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_point_transactions_idempotency
        (idempotency_key),

    KEY idx_point_transactions_user_created
        (user_id, created_at),

    KEY idx_point_transactions_reference
        (reference_type, reference_id),

    CONSTRAINT fk_point_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

## 10.3 字段说明

| 字段              | 类型            | NULL | 说明         |
| ----------------- | --------------- | ---- | ------------ |
| `id`              | BIGINT UNSIGNED | NO   | 流水 ID      |
| `user_id`         | BIGINT UNSIGNED | NO   | 用户 ID      |
| `amount`          | INT             | NO   | 积分变化量   |
| `type`            | VARCHAR(50)     | NO   | 积分事件     |
| `reference_type`  | VARCHAR(50)     | YES  | 关联业务类型 |
| `reference_id`    | BIGINT UNSIGNED | YES  | 关联业务 ID  |
| `idempotency_key` | VARCHAR(255)    | NO   | 幂等键       |
| `created_at`      | DATETIME        | NO   | 创建时间     |

------

# 11. 积分事件定义

当前 MVP 支持：

| type               | 触发场景               |
| ------------------ | ---------------------- |
| `QUESTION_CREATED` | 用户成功发布问题       |
| `ANSWER_CREATED`   | 用户成功发布回答       |
| `QUESTION_LIKED`   | 用户的问题获得点赞     |
| `ANSWER_LIKED`     | 用户的回答获得点赞     |
| `ANSWER_ACCEPTED`  | 用户的回答被提问者采纳 |

积分具体数值由 PRD 定义，数据库不硬编码积分规则。

积分规则应由后端 Service / Constants 统一维护。

------

# 12. 积分幂等设计

积分流水必须包含：

```
idempotency_key
```

示例：

```
QUESTION_CREATED:1001
ANSWER_CREATED:2001
ANSWER_ACCEPTED:2001
QUESTION_LIKED:1001:USER:10
ANSWER_LIKED:2001:USER:10
```

数据库：

```
UNIQUE(idempotency_key)
```

避免因为：

- 网络重试。
- 重复请求。
- 服务异常重试。
- 并发请求。

导致同一业务事件重复发放积分。

------

# 13. 表之间的外键关系

```
users.id
    │
    ├─────────────── questions.user_id
    │
    ├─────────────── answers.user_id
    │
    ├─────────────── likes.user_id
    │
    └─────────────── point_transactions.user_id


questions.id
    │
    ├─────────────── answers.question_id
    │
    └─────────────── question_tags.question_id


tags.id
    │
    └─────────────── question_tags.tag_id
```

`questions.accepted_answer_id` 与 `answers.id` 形成逻辑关联。

由于两张表之间存在循环依赖风险：

```
questions
    ↓
answers
    ↓
questions.accepted_answer_id
```

MVP 阶段建议由 Service 层保证 `accepted_answer_id` 的合法性，而不是强制建立数据库外键。

------

# 14. 删除策略

## 14.1 用户

用户表暂不设计物理删除流程。

如果未来支持注销账号，可以增加：

```
deleted_at
```

或采用账号状态字段。

当前 MVP 不扩展该模型。

## 14.2 问题

问题采用逻辑删除：

```
deleted_at IS NULL
```

表示正常。

删除：

```
deleted_at = CURRENT_TIMESTAMP
status = DELETED
```

## 14.3 回答

回答同样采用逻辑删除：

```
deleted_at IS NULL
```

删除：

```
deleted_at = CURRENT_TIMESTAMP
status = DELETED
```

------

# 15. 级联删除策略

问题与标签关系：

```
questions
    ↓
question_tags
```

删除问题后，其标签关联记录可以：

```
ON DELETE CASCADE
```

用户与点赞：

```
users
    ↓
likes
```

用户被物理删除时可以级联删除点赞关系。

用户与积分：

```
users
    ↓
point_transactions
```

如果未来需要完整审计历史，则不建议物理删除用户及积分流水。

因此，生产环境是否启用用户物理删除，需要根据账号生命周期策略进一步确定。

------

# 16. 统计字段设计

## questions

```
view_count
like_count
answer_count
```

## answers

```
like_count
```

这些字段属于冗余统计字段。

目的：

```
避免每次列表查询都执行 COUNT()
```

例如首页问题列表可以直接：

```
SELECT
    id,
    title,
    like_count,
    answer_count,
    view_count
FROM questions;
```

------

# 17. 统计字段一致性

统计字段不能由前端直接修改。

例如：

```
点赞问题
    ↓
INSERT likes
    ↓
questions.like_count + 1
```

取消点赞：

```
DELETE likes
    ↓
questions.like_count - 1
```

两个操作必须放在同一个事务中。

------

# 18. 问题创建事务

创建问题涉及：

```
questions
question_tags
users
point_transactions
```

事务：

```
BEGIN

1. 创建 questions
2. 创建 question_tags
3. 创建 point_transactions
4. 更新 users.points

COMMIT
```

任一步失败：

```
ROLLBACK
```

确保不会出现：

```
问题创建成功
但是积分没有增加
```

或者：

```
积分增加
但是问题创建失败
```

------

# 19. 回答创建事务

涉及：

```
answers
questions.answer_count
point_transactions
users.points
```

事务：

```
BEGIN

1. 创建 answer
2. questions.answer_count + 1
3. 创建 point_transaction
4. users.points + 积分

COMMIT
```

------

# 20. 点赞事务

涉及：

```
likes
questions.like_count / answers.like_count
point_transactions
users.points
```

事务：

```
BEGIN

1. 验证目标
2. 检查点赞关系
3. 创建 likes
4. 更新目标 like_count
5. 创建积分流水
6. 更新目标作者积分

COMMIT
```

注意：

> 点赞积分属于被点赞内容作者，而不是执行点赞操作的用户。

------

# 21. 取消点赞事务

```
BEGIN

1. 查询点赞关系
2. 删除 likes
3. 更新 like_count

COMMIT
```

按照当前业务设计：

> 取消点赞不会追回已经产生的积分。

因此取消点赞不创建负积分流水。

------

# 22. 采纳答案事务

采纳答案是数据库层面最重要的事务之一。

事务流程：

```
BEGIN
    ↓
锁定 questions
    ↓
验证问题作者
    ↓
验证问题状态
    ↓
验证答案属于该问题
    ↓
验证答案未被删除
    ↓
更新 answers.status
    ↓
更新 questions.accepted_answer_id
    ↓
更新 questions.status = SOLVED
    ↓
创建 ANSWER_ACCEPTED 流水
    ↓
更新回答者积分
    ↓
COMMIT
```

需要通过数据库行锁或等价的并发控制方式防止：

```
请求 A → 采纳答案 A
请求 B → 采纳答案 B
```

最终导致一个问题存在两个采纳答案。

------

# 23. 采纳状态约束

数据库模型要求：

```
一个 Question
    ↓
最多一个 accepted_answer_id
```

同时：

```
Question.status = SOLVED
```

应该对应：

```
Question.accepted_answer_id IS NOT NULL
```

具体状态一致性由 `QuestionService` 保证。

------

# 24. 首页问题查询

首页需要支持：

```
最新
热门
未解决
```

## 最新

```
ORDER BY created_at DESC
```

推荐使用：

```
idx_questions_status_created_at
```

## 未解决

```
WHERE status = 'UNSOLVED'
ORDER BY created_at DESC
```

使用：

```
idx_questions_status_created_at
```

## 热门

热门排序由业务层定义热度计算逻辑。

数据库提供：

```
like_count
answer_count
view_count
created_at
```

作为排序数据源。

------

# 25. 标签筛选查询

查询某标签下的问题：

```
questions
    ↓
question_tags
    ↓
tags
```

逻辑：

```
SELECT q.*
FROM questions q
JOIN question_tags qt
    ON q.id = qt.question_id
WHERE qt.tag_id = ?
  AND q.deleted_at IS NULL;
```

索引：

```
question_tags(tag_id, question_id)
```

用于支持标签筛选。

------

# 26. 问题详情查询

问题详情需要获取：

```
Question
User
Tags
Answers
```

关系：

```
Question
 ├── User
 ├── Tags
 └── Answers
       └── User
```

不建议一次查询返回所有关联内容。

可以根据接口需求拆分查询。

------

# 27. 回答查询

回答按照问题查询：

```
SELECT *
FROM answers
WHERE question_id = ?
  AND deleted_at IS NULL
ORDER BY created_at ASC;
```

索引：

```
(question_id, created_at)
```

------

# 28. 用户问题查询

查询用户发布的问题：

```
SELECT *
FROM questions
WHERE user_id = ?
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

建议索引：

```
(user_id)
```

如果后续查询频率较高，可以升级为：

```
(user_id, created_at)
```

------

# 29. 用户回答查询

```
SELECT *
FROM answers
WHERE user_id = ?
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

使用：

```
idx_answers_user_id
```

------

# 30. 点赞状态查询

判断当前用户是否点赞某个目标：

```
SELECT id
FROM likes
WHERE user_id = ?
  AND target_type = ?
  AND target_id = ?
LIMIT 1;
```

依赖：

```
UNIQUE(user_id, target_type, target_id)
```

------

# 31. 数据库事务隔离

MVP 使用 MySQL InnoDB 默认事务机制。

涉及关键业务时：

```
BEGIN
    ↓
SELECT ... FOR UPDATE
    ↓
业务修改
    ↓
COMMIT
```

重点应用场景：

```
采纳答案
积分更新
点赞统计更新
```

避免并发更新产生数据不一致。

------

# 32. 积分余额更新

积分更新不能使用：

```
SELECT points;
-- 在应用层计算
UPDATE users SET points = ?;
```

因为并发情况下可能产生丢失更新。

应使用数据库原子更新：

```
UPDATE users
SET points = points + ?
WHERE id = ?;
```

同时与积分流水处于同一事务中。

------

# 33. 防止负积分

数据库：

```
points >= 0
```

业务层也必须检查。

更新时：

```
当前积分
    ↓
验证扣减后 >= 0
    ↓
执行更新
```

当前 MVP 主要是积分奖励，因此通常只进行增加，不设计积分消费。

------

# 34. 字符集与排序

统一：

```
utf8mb4
```

原因：

- 支持中文。
- 支持英文。
- 支持 Emoji。
- 支持更多 Unicode 字符。

数据库、连接、表及字段应保持统一字符集配置。

------

# 35. 时间字段规范

统一使用：

```
DATETIME
```

核心表：

```
created_at
updated_at
```

可删除实体：

```
deleted_at
```

时间由服务端 / 数据库统一生成。

前端不得将客户端本地时间作为可信业务时间。

------

# 36. ID 设计

核心实体统一：

```
BIGINT UNSIGNED
```

包括：

```
users.id
questions.id
answers.id
tags.id
likes.id
point_transactions.id
```

避免 MVP 阶段引入 UUID 带来的额外复杂度。

------

# 37. 数据库初始化顺序

建议按照依赖关系创建：

```
1. users
      ↓
2. questions
      ↓
3. answers
      ↓
4. tags
      ↓
5. question_tags
      ↓
6. likes
      ↓
7. point_transactions
```

其中 `question_tags`、`likes` 等关系表依赖前置实体表。

------

# 38. Migration 设计

数据库结构必须通过 Migration 管理。

建议：

```
migrations/
├── 001_create_users.sql
├── 002_create_questions.sql
├── 003_create_answers.sql
├── 004_create_tags.sql
├── 005_create_question_tags.sql
├── 006_create_likes.sql
└── 007_create_point_transactions.sql
```

实际项目可以根据所使用 ORM 的 Migration 机制调整文件格式。

------

# 39. Seed 数据

开发环境应提供 Seed 数据：

```
users
questions
answers
tags
question_tags
likes
point_transactions
```

Seed 数据仅用于：

- 本地开发。
- 测试。
- UI 调试。
- API 调试。

禁止将测试账号或测试密码作为生产账号使用。

------

# 40. 数据完整性规则

必须保证：

```
User
    ↓
存在才能创建 Question
Question
    ↓
存在才能创建 Answer
Question
    ↓
必须存在才能关联 Tag
Answer
    ↓
必须属于当前 Question
    ↓
才能被采纳
Like
    ↓
必须对应存在的 Question / Answer
PointTransaction
    ↓
必须对应有效 User
```

------

# 41. 不在数据库层实现的业务逻辑

以下业务不直接由数据库决定：

```
热门排序算法
积分具体规则
用户是否可以采纳答案
用户是否可以编辑问题
用户是否可以编辑回答
用户是否可以点赞自己的内容
Markdown 安全处理
API 权限判断
```

这些规则属于应用 Service 层。

数据库负责：

```
数据存储
数据完整性
唯一性
基础约束
事务
索引
```

------

# 42. 数据库性能原则

MVP 阶段优先保持简单。

主要性能措施：

```
合理索引
+
分页
+
统计字段
+
避免 N+1 查询
+
事务控制
```

暂不引入：

```
Redis
Elasticsearch
分库分表
读写分离
数据库集群
```

除非实际数据规模证明存在必要性。

------

# 43. N+1 查询防范

例如查询 20 个问题：

错误方式：

```
查询 20 个问题
    ↓
循环查询 20 个用户
    ↓
循环查询 20 组标签
```

产生大量 SQL。

应该采用：

```
Question List
    ↓
批量查询 Users
    ↓
批量查询 Tags
    ↓
Service / ORM 组装
```

------

# 44. 数据库安全

必须遵循：

- 数据库账号使用最小权限。
- 生产环境禁止使用 root 作为应用账号。
- 密码存储使用密码哈希。
- 数据库连接信息通过环境变量配置。
- 不将 `.env` 提交到 Git。
- 所有 SQL 参数使用参数化查询。
- 生产数据库定期备份。

------

# 45. 数据库备份

生产环境应建立：

```
全量备份
+
增量 / Binlog
```

具体备份周期不属于当前 MVP 数据库设计范围。

最低要求：

> 数据库出现故障后，应能够从备份恢复核心业务数据。

------

# 46. 数据库设计验收标准

## 表结构

- 

  ```
  users
  ```

   表完成。

- 

  ```
  questions
  ```

   表完成。

- 

  ```
  answers
  ```

   表完成。

- 

  ```
  tags
  ```

   表完成。

- 

  ```
  question_tags
  ```

   表完成。

- 

  ```
  likes
  ```

   表完成。

- 

  ```
  point_transactions
  ```

   表完成。

## 关系

- 

  用户与问题关系正确。

- 

  用户与回答关系正确。

- 

  问题与回答关系正确。

- 

  问题与标签多对多关系正确。

- 

  用户与点赞关系正确。

- 

  用户与积分流水关系正确。

## 数据一致性

- 

  点赞不能重复。

- 

  积分不能重复发放。

- 

  一个问题最多一个采纳答案。

- 

  点赞数量与点赞关系保持一致。

- 

  回答数量与回答关系保持一致。

- 

  积分余额与积分流水保持一致。

## 性能

- 

  问题列表存在必要索引。

- 

  标签筛选存在必要索引。

- 

  回答列表存在必要索引。

- 

  用户内容查询存在必要索引。

- 

  点赞查询存在唯一索引。

## 安全

- 

  密码不明文存储。

- 

  SQL 使用参数化查询。

- 

  数据库账号遵循最小权限。

- 

  敏感配置不进入 Git。

------

# 47. 最终数据库架构

```
┌──────────────────┐
│      users       │
│──────────────────│
│ id               │
│ username         │
│ email            │
│ password_hash    │
│ role             │
│ points           │
└───────┬──────────┘
        │
        ├───────────────────────┐
        │                       │
        ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│    questions     │    │     answers      │
│──────────────────│    │──────────────────│
│ id               │    │ id               │
│ user_id          │    │ question_id      │
│ title            │    │ user_id          │
│ content          │    │ content          │
│ status           │    │ status           │
│ view_count       │    │ like_count       │
│ like_count       │    └────────┬─────────┘
│ answer_count     │             │
│ accepted_answer  │             │
└───────┬──────────┘             │
        │                        │
        ↓                        │
┌──────────────────┐             │
│  question_tags   │             │
│──────────────────│             │
│ question_id      │             │
│ tag_id           │             │
└────────┬─────────┘             │
         │                       │
         ↓                       │
┌──────────────────┐             │
│      tags        │             │
│──────────────────│             │
│ id               │             │
│ name             │             │
└──────────────────┘             │
                                 │
                 ┌───────────────┘
                 ↓
          ┌──────────────┐
          │    likes     │
          │──────────────│
          │ user_id      │
          │ target_type  │
          │ target_id    │
          └──────────────┘

          ┌───────────────────────┐
          │  point_transactions   │
          │───────────────────────│
          │ user_id               │
          │ amount                │
          │ type                  │
          │ reference_type        │
          │ reference_id          │
          │ idempotency_key       │
          └───────────────────────┘
```

该数据库设计与 `PRD.md` 和 `TECH_DESIGN.md` 的 MVP 范围保持一致，不额外引入评论、收藏、通知、举报、搜索引擎、缓存系统等未纳入当前技术范围的数据库模型。