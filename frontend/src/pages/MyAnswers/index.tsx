import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { RequireAuth } from '../../components/common/RequireAuth';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { AnswerListItem } from '../../components/answer/AnswerListItem';
import { getMyAnswersApi } from '../../services/api/userApi';
import type { UserAnswerListResult } from '../../types';

const PAGE_SIZE = 20;

function MyAnswersContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const [result, setResult] = useState<UserAnswerListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getMyAnswersApi({ page, pageSize: PAGE_SIZE })
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
    return <EmptyState title="还没有回答" description="去首页看看有哪些问题可以回答吧" />;
  }

  return (
    <div>
      <Breadcrumb
        items={[{ label: '首页', to: '/' }, { label: '个人中心', to: '/me' }, { label: '我的回答' }]}
      />
      <div className="answer-list">
        {result.items.map((answer) => (
          <AnswerListItem key={answer.id} answer={answer} />
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

export function MyAnswersPage() {
  return (
    <RequireAuth>
      <MyAnswersContent />
    </RequireAuth>
  );
}
