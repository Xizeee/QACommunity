import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MarkdownContent } from '../../components/common/MarkdownContent';
import { TagList } from '../../components/tag/TagList';
import { deleteQuestionApi, getQuestionApi } from '../../services/api/questionApi';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/format';
import type { QuestionDetail } from '../../types';

export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const questionId = Number(id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      setError('问题 ID 不合法');
      setLoading(false);
      return;
    }
    let active = true;
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
  }, [id]);

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

  if (loading) {
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
        <span>👍 {question.likeCount}</span>
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
  );
}
