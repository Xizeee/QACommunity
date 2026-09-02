import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { QuestionForm } from '../../components/question/QuestionForm';
import { getQuestionApi, updateQuestionApi } from '../../services/api/questionApi';
import { getTagsApi } from '../../services/api/tagApi';
import { useAuthStore } from '../../stores/authStore';
import type { QuestionDetail, TagWithCount } from '../../types';

export function EditQuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const questionId = Number(id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      setError('问题 ID 不合法');
      setLoading(false);
      return;
    }
    let active = true;
    Promise.all([getQuestionApi(questionId), getTagsApi()])
      .then(([questionData, tagData]) => {
        if (active) {
          setQuestion(questionData);
          setTags(tagData);
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

  const handleSubmit = useCallback(
    async (payload: { title: string; content: string; tagIds: number[] }) => {
      if (!question) {
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await updateQuestionApi(question.id, payload);
        navigate(`/questions/${question.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : '保存失败');
      } finally {
        setSubmitting(false);
      }
    },
    [navigate, question],
  );

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

  if (!user) {
    return (
      <section className="card auth-card">
        <h2>编辑问题</h2>
        <p className="hint">
          请先 <Link to="/login">登录</Link> 后再编辑问题。
        </p>
      </section>
    );
  }

  if (!question) {
    return null;
  }

  if (question.author.id !== user.id) {
    return (
      <section className="card auth-card">
        <h2>编辑问题</h2>
        <p className="form-error">只能编辑自己的问题</p>
      </section>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: '首页', to: '/' },
          { label: question.title, to: `/questions/${question.id}` },
          { label: '编辑问题' },
        ]}
      />
      <section className="card">
        <h2>编辑问题</h2>
        <QuestionForm
          tags={tags}
          initial={{
            title: question.title,
            content: question.content,
            tagIds: question.tags.map((tag) => tag.id),
          }}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          submitLabel="保存修改"
        />
      </section>
    </>
  );
}
