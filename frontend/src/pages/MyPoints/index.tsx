import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { RequireAuth } from '../../components/common/RequireAuth';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { getMyPointsApi } from '../../services/api/userApi';
import { formatDate } from '../../utils/format';
import type { PointListResult } from '../../types';

const PAGE_SIZE = 20;

// 积分行为 → 中文说明（对应 point_transactions.type，DATABASE_DESIGN 11）
const POINT_TYPE_LABELS: Record<string, string> = {
  QUESTION_CREATED: '发布问题',
  ANSWER_CREATED: '发布回答',
  QUESTION_LIKED: '问题被点赞',
  ANSWER_LIKED: '回答被点赞',
  ANSWER_ACCEPTED: '回答被采纳',
};

function MyPointsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const [result, setResult] = useState<PointListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getMyPointsApi({ page, pageSize: PAGE_SIZE })
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
  if (!result) {
    return <EmptyState title="加载失败" />;
  }

  return (
    <div>
      <Breadcrumb
        items={[{ label: '首页', to: '/' }, { label: '个人中心', to: '/me' }, { label: '我的积分' }]}
      />
      <div className="points-summary">
        <span className="points-total">{result.currentPoints}</span>
        <span className="stat-label">当前积分</span>
      </div>

      {result.items.length === 0 ? (
        <EmptyState title="暂无积分记录" description="回答问题、获得点赞或采纳即可获得积分" />
      ) : (
        <>
          <div className="point-list">
            {result.items.map((item) => (
              <div key={item.id} className="point-item">
                <span className="point-label">
                  {POINT_TYPE_LABELS[item.type] ?? item.type}
                </span>
                <span
                  className={`point-amount ${item.amount >= 0 ? 'positive' : 'negative'}`}
                >
                  {item.amount >= 0 ? `+${item.amount}` : item.amount}
                </span>
                <span className="meta-author">{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
          <Pagination
            page={result.pagination.page}
            pageSize={result.pagination.pageSize}
            total={result.pagination.total}
            onChange={changePage}
          />
        </>
      )}
    </div>
  );
}

export function MyPointsPage() {
  return (
    <RequireAuth>
      <MyPointsContent />
    </RequireAuth>
  );
}
