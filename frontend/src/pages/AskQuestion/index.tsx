import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { QuestionForm } from '../../components/question/QuestionForm';
import { createQuestionApi } from '../../services/api/questionApi';
import { getTagsApi } from '../../services/api/tagApi';
import { useAuthStore } from '../../stores/authStore';
import type { TagWithCount } from '../../types';

export function AskQuestionPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);

  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getTagsApi()
      .then((data) => {
        if (active) {
          setTags(data);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (authStatus === 'idle' || authStatus === 'loading') {
    return <p className="hint">加载中...</p>;
  }

  if (!user) {
    return (
      <section className="card auth-card">
        <h2>发布问题</h2>
        <p className="hint">
          请先 <Link to="/login">登录</Link> 后再发布问题。
        </p>
      </section>
    );
  }

  const handleSubmit = async (payload: {
    title: string;
    content: string;
    tagIds: number[];
  }) => {
    setSubmitting(true);
    setError(null);
    try {
      const question = await createQuestionApi(payload);
      navigate(`/questions/${question.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: '首页', to: '/' }, { label: '发布问题' }]} />
      <section className="card">
        <h2>发布问题</h2>
        <QuestionForm
          tags={tags}
          submitting={submitting}
          error={error}
          onSubmit={handleSubmit}
          submitLabel="发布问题"
        />
      </section>
    </>
  );
}
