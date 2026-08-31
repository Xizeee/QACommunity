import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QuestionCard } from '../../components/question/QuestionCard';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { getQuestionsApi } from '../../services/api/questionApi';
import { useLikedIds } from '../../hooks/useLikedIds';
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
  const keyword = searchParams.get('keyword') ?? '';
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const [result, setResult] = useState<QuestionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(keyword);

  const questionIds = useMemo(
    () => (result ? result.items.map((question) => question.id) : []),
    [result],
  );
  const likedQuestionIds = useLikedIds('QUESTION', questionIds);

  // URL 关键词变化（如清除搜索）时同步回输入框
  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getQuestionsApi({
      page,
      pageSize: PAGE_SIZE,
      sort,
      tag: tag || undefined,
      keyword: keyword || undefined,
    })
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
  }, [page, sort, tag, keyword]);

  const updateParams = useCallback(
    (next: {
      sort?: string;
      page?: number;
      tag?: string | null;
      keyword?: string | null;
    }) => {
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
        if (next.keyword !== undefined) {
          if (next.keyword === null || next.keyword === '') {
            params.delete('keyword');
          } else {
            params.set('keyword', next.keyword);
          }
        }
        // 排序、筛选或搜索变化时重置页码
        const resetPage =
          next.sort !== undefined || next.tag !== undefined || next.keyword !== undefined;
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

  const handleSearch = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      updateParams({ keyword: searchInput.trim() });
    },
    [searchInput, updateParams],
  );

  return (
    <div>
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="搜索问题标题、内容或标签"
          aria-label="搜索问题"
        />
        <button type="submit">搜索</button>
      </form>

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

      {keyword && (
        <p className="filter-hint">
          搜索「{keyword}」
          <button type="button" className="link-button" onClick={() => updateParams({ keyword: null })}>
            清除搜索
          </button>
        </p>
      )}

      {loading || status === 'idle' || status === 'loading' ? (
        <p className="hint">加载中...</p>
      ) : error ? (
        <EmptyState title={error} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState
          title={keyword ? '没有找到相关问题' : tag ? '该标签下暂无问题' : '暂无问题'}
          description={
            keyword
              ? '尝试更换关键词，或者发布一个新问题。'
              : user
                ? '点击右上角「提问」发布第一个问题'
                : '注册登录后即可发布问题'
          }
        />
      ) : (
        <>
          <div className="question-list">
            {result.items.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                liked={likedQuestionIds.has(question.id)}
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
