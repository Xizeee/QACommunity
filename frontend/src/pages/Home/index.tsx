import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QuestionCard } from '../../components/question/QuestionCard';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { getQuestionsApi } from '../../services/api/questionApi';
import { useAuthStore } from '../../stores/authStore';
import type { QuestionListResult, QuestionSort } from '../../types';

const SORT_OPTIONS: Array<{ value: QuestionSort; label: string }> = [
  { value: 'latest', label: '最新' },
  { value: 'hot', label: '热门' },
  { value: 'unsolved', label: '未解决' },
];

const PAGE_SIZE = 20;

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  const sort = (searchParams.get('sort') as QuestionSort) ?? 'latest';
  const tag = searchParams.get('tag') ?? '';
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const [result, setResult] = useState<QuestionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getQuestionsApi({ page, pageSize: PAGE_SIZE, sort, tag: tag || undefined })
      .then((data) => {
        if (active) {
          setResult(data);
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
  }, [page, sort, tag]);

  const updateParams = useCallback(
    (next: { sort?: string; page?: number; tag?: string | null }) => {
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next.sort !== undefined) {
          params.set('sort', next.sort);
        }
        if (next.tag !== undefined) {
          if (next.tag === null || next.tag === '') {
            params.delete('tag');
          } else {
            params.set('tag', next.tag);
          }
        }
        // 排序或筛选变化时重置页码
        const resetPage = next.sort !== undefined || next.tag !== undefined;
        if (resetPage) {
          params.delete('page');
        } else if (next.page !== undefined) {
          params.set('page', String(next.page));
        }
        return params;
      });
    },
    [setSearchParams],
  );

  return (
    <div>
      <div className="home-toolbar">
        <div className="sort-tabs">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={sort === option.value ? 'active' : ''}
              onClick={() => updateParams({ sort: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
        {user && (
          <Link to="/questions/ask" className="primary-link">
            提问
          </Link>
        )}
      </div>

      {tag && (
        <p className="filter-hint">
          标签「{tag}」
          <button type="button" className="link-button" onClick={() => updateParams({ tag: null })}>
            清除筛选
          </button>
        </p>
      )}

      {loading || status === 'idle' || status === 'loading' ? (
        <p className="hint">加载中...</p>
      ) : error ? (
        <EmptyState title={error} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title={tag ? '该标签下暂无问题' : '暂无问题'}
          description={user ? '点击右上角「提问」发布第一个问题' : '注册登录后即可发布问题'}
        />
      ) : (
        <>
          <div className="question-list">
            {result.items.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onTagClick={(name) => updateParams({ tag: name })}
              />
            ))}
          </div>
          <Pagination
            page={result.pagination.page}
            pageSize={result.pagination.pageSize}
            total={result.pagination.total}
            onChange={(nextPage) => updateParams({ page: nextPage })}
          />
        </>
      )}
    </div>
  );
}
