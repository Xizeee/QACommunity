import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MarkdownContent } from '../../components/common/MarkdownContent';
import { TagList } from '../../components/tag/TagList';
import { Pagination } from '../../components/common/Pagination';
import { AnswerForm } from '../../components/answer/AnswerForm';
import { AnswerList } from '../../components/answer/AnswerList';
import { LikeButton } from '../../components/like/LikeButton';
import { deleteQuestionApi, getQuestionApi } from '../../services/api/questionApi';
import {
  createAnswerApi,
  deleteAnswerApi,
  getAnswersApi,
  updateAnswerApi,
} from '../../services/api/answerApi';
import { useLikedIds } from '../../hooks/useLikedIds';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/format';
import type { AnswerListResult, QuestionDetail } from '../../types';

const ANSWER_PAGE_SIZE = 20;

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [answerResult, setAnswerResult] = useState<AnswerListResult | null>(null);
  const [answerLoading, setAnswerLoading] = useState(true);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  // 发布成功后递增，通过 key 重置 AnswerForm 的内部草稿
  const [answerFormKey, setAnswerFormKey] = useState(0);

  const questionId = Number(id);

  useEffect(() => {
    if (!Number.isInteger(questionId) || questionId <= 0) {
      setError('问题 ID 不合法');
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getQuestionApi(questionId)
      .then((data) => {
        if (active) {
          setQuestion(data);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [questionId]);

  const reloadAnswers = useCallback(
    (page: number) => {
      let active = true;
      setAnswerLoading(true);
      setAnswerError(null);
      getAnswersApi(questionId, { page, pageSize: ANSWER_PAGE_SIZE })
        .then((data) => {
          if (active) {
            setAnswerResult(data);
          }
        })
        .catch((err: Error) => {
          if (active) {
            setAnswerError(err.message);
          }
        })
        .finally(() => {
          if (active) {
            setAnswerLoading(false);
          }
        });
      return () => {
        active = false;
      };
    },
    [questionId],
  );

  useEffect(() => {
    if (question) {
      reloadAnswers(1);
    }
  }, [question, reloadAnswers]);

  const questionLikeIds = useMemo(() => (question ? [question.id] : []), [question]);
  const likedQuestionIds = useLikedIds('QUESTION', questionLikeIds);

  const answerIds = useMemo(
    () => (answerResult ? answerResult.items.map((answer) => answer.id) : []),
    [answerResult],
  );
  const likedAnswerIds = useLikedIds('ANSWER', answerIds);

  const handleDelete = async () => {
    if (!question) {
      return;
    }
    // PRD 9.4：删除操作必须要求用户确认
    if (!window.confirm('确定要删除这个问题吗？删除后将无法恢复。')) {
      return;
    }
    setDeleting(true);
    try {
      await deleteQuestionApi(question.id);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
      setDeleting(false);
    }
  };

  const handleAnswerSubmit = async (content: string) => {
    setAnswerSubmitting(true);
    setAnswerError(null);
    try {
      await createAnswerApi(questionId, content);
      // 重新加载第一页并刷新问题的回答数展示
      reloadAnswers(1);
      setQuestion((current) =>
        current ? { ...current, answerCount: current.answerCount + 1 } : current,
      );
      setAnswerFormKey((key) => key + 1);
    } catch (err) {
      setAnswerError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const handleAnswerUpdated = async (answer: AnswerListResult['items'][number]) => {
    const updated = await updateAnswerApi(answer.id, answer.content);
    setAnswerResult((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => (item.id === updated.id ? updated : item)),
          }
        : current,
    );
  };

  const handleAnswerDeleted = async (answerId: number) => {
    await deleteAnswerApi(answerId);
    setAnswerResult((current) => {
      if (!current) {
        return current;
      }
      const items = current.items.filter((item) => item.id !== answerId);
      const total = Math.max(0, current.pagination.total - 1);
      // 当前页删空且不在第一页时回退一页
      if (items.length === 0 && current.pagination.page > 1) {
        reloadAnswers(current.pagination.page - 1);
        return current;
      }
      return { items, pagination: { ...current.pagination, total } };
    });
    setQuestion((current) =>
      current ? { ...current, answerCount: Math.max(0, current.answerCount - 1) } : current,
    );
  };

  if (loading || authStatus === 'idle' || authStatus === 'loading') {
    return <p className="hint">加载中...</p>;
  }

  if (error && !question) {
    return (
      <section className="card">
        <p className="form-error">{error}</p>
        <Link to="/" className="hint">
          返回首页
        </Link>
      </section>
    );
  }

  if (!question) {
    return null;
  }

  const isAuthor = user?.id === question.author.id;

  return (
    <>
      <section className="card question-detail">
        <div className="question-card-head">
          <h1 className="detail-title">{question.title}</h1>
          {question.status === 'SOLVED' && <span className="badge-solved">已解决</span>}
        </div>
        <div className="detail-meta">
          <span>
            {question.author.username} · 发布于 {formatDate(question.createdAt)}
          </span>
          <span>👁 {question.viewCount} 次浏览</span>
          <LikeButton
            targetType="QUESTION"
            targetId={question.id}
            likeCount={question.likeCount}
            liked={likedQuestionIds.has(question.id)}
            disabled={isAuthor}
          />
          <span>💬 {question.answerCount}</span>
          {question.updatedAt !== question.createdAt && (
            <span>更新于 {formatDate(question.updatedAt)}</span>
          )}
        </div>
        <TagList tags={question.tags} />
        <MarkdownContent content={question.content} />
        {isAuthor && (
          <div className="detail-actions">
            <Link to={`/questions/${question.id}/edit`} className="secondary-link">
              编辑
            </Link>
            <button
              type="button"
              className="danger-button"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '删除'}
            </button>
          </div>
        )}
      </section>

      <section className="card answer-section">
        <h2 className="answer-section-title">
          {answerResult ? `${answerResult.pagination.total} 个回答` : '回答'}
        </h2>
        {answerLoading ? (
          <p className="hint">加载中...</p>
        ) : answerError && !answerResult ? (
          <p className="form-error">{answerError}</p>
        ) : (
          <>
            <AnswerList
              answers={answerResult?.items ?? []}
              currentUserId={user?.id}
              likedAnswerIds={likedAnswerIds}
              onUpdated={handleAnswerUpdated}
              onDeleted={handleAnswerDeleted}
            />
            {answerResult && answerResult.pagination.total > ANSWER_PAGE_SIZE && (
              <Pagination
                page={answerResult.pagination.page}
                pageSize={answerResult.pagination.pageSize}
                total={answerResult.pagination.total}
                onChange={(page) => reloadAnswers(page)}
              />
            )}
          </>
        )}

        {user ? (
          <div className="answer-create">
            <h3>你的回答</h3>
            <AnswerForm
              key={answerFormKey}
              submitting={answerSubmitting}
              error={answerError}
              onSubmit={handleAnswerSubmit}
            />
          </div>
        ) : (
          <p className="hint">
            <Link to="/login">登录</Link> 后即可回答该问题。
          </p>
        )}
      </section>
    </>
  );
}
