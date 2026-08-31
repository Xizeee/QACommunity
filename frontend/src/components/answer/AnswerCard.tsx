import { FormEvent, useState } from 'react';
import { MarkdownContent } from '../common/MarkdownContent';
import { LikeButton } from '../like/LikeButton';
import { formatDate } from '../../utils/format';
import type { AnswerSummary } from '../../types';

interface AnswerCardProps {
  answer: AnswerSummary;
  isOwner: boolean;
  liked: boolean;
  canAccept: boolean;
  onAccept: (answerId: number) => Promise<void>;
  onUpdated: (answer: AnswerSummary) => Promise<void>;
  onDeleted: (answerId: number) => Promise<void>;
}

export function AnswerCard({
  answer,
  isOwner,
  liked,
  canAccept,
  onAccept,
  onUpdated,
  onDeleted,
}: AnswerCardProps) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(answer.content);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (content.trim().length === 0) {
      setError('回答内容不能为空');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onUpdated({ ...answer, content });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条回答吗？')) {
      return;
    }
    try {
      await onDeleted(answer.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleAccept = async () => {
    if (!window.confirm('确定采纳这条回答为最佳答案吗？采纳后问题将标记为已解决。')) {
      return;
    }
    setAccepting(true);
    setAcceptError(null);
    try {
      await onAccept(answer.id);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : '采纳失败');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <article className="answer-card">
      <div className="answer-card-head">
        <span className="meta-author">
          {answer.author.username} · {formatDate(answer.createdAt)}
        </span>
        {answer.status === 'ACCEPTED' && <span className="badge-solved">已采纳</span>}
        {isOwner && !editing && (
          <span className="answer-actions">
            <button type="button" className="link-button" onClick={() => setEditing(true)}>
              编辑
            </button>
            <button type="button" className="link-button danger" onClick={handleDelete}>
              删除
            </button>
          </span>
        )}
      </div>
      {editing ? (
        <form className="answer-edit-form" onSubmit={handleSave}>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
          {error && <p className="form-error">{error}</p>}
          <div className="answer-edit-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setContent(answer.content);
                setError(null);
              }}
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <>
          <MarkdownContent content={answer.content} />
          {answer.updatedAt !== answer.createdAt && (
            <p className="hint edited-hint">更新于 {formatDate(answer.updatedAt)}</p>
          )}
        </>
      )}
      <div className="answer-card-footer">
        <LikeButton
          targetType="ANSWER"
          targetId={answer.id}
          likeCount={answer.likeCount}
          liked={liked}
          disabled={isOwner}
        />
        {canAccept && answer.status !== 'ACCEPTED' && (
          <button
            type="button"
            className="accept-button"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? '采纳中...' : '采纳答案'}
          </button>
        )}
        {acceptError && <p className="form-error">{acceptError}</p>}
      </div>
    </article>
  );
}
