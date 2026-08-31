-- 002_create_questions
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
