import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RequireAuth } from '../../components/common/RequireAuth';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { getMyQuestionsApi } from '../../services/api/userApi';
import { formatDate } from '../../utils/format';
import type { QuestionListResult } from '../../types';

const PAGE_SIZE = 20;

function MyQuestionsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const [result, setResult] = useState<QuestionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getMyQuestionsApi({ page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page]);

  const changePage = useCallback(
    (nextPage: number) => {
      setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
    },
    [setSearchParams],
  );

  if (loading) {
    return <p className="hint">加载中...</p>;
  }
  if (error) {
    return <EmptyState title={error} />;
  }
  if (!result || result.items.length === 0) {
    return (
      <EmptyState
        title="还没有提问"
        description="点击右上角「提问」发布第一个问题"
      />
    );
  }

  return (
    <div>
      <div className="question-list">
        {result.items.map((question) => (
          <article key={question.id} className="question-card">
            <div className="question-card-head">
              <Link to={`/questions/${question.id}`} className="question-title">
                {question.title}
              </Link>
              {question.status === 'SOLVED' && <span className="badge-solved">已解决</span>}
            </div>
            <div className="question-card-meta">
              <span>💬 {question.answerCount}</span>
              <span>👍 {question.likeCount}</span>
              <span className="meta-author">{formatDate(question.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        page={result.pagination.page}
        pageSize={result.pagination.pageSize}
        total={result.pagination.total}
        onChange={changePage}
      />
    </div>
  );
}

export function MyQuestionsPage() {
  return (
    <RequireAuth>
      <MyQuestionsContent />
    </RequireAuth>
  );
}
