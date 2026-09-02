import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Pagination } from '../../components/common/Pagination';
import { EmptyState } from '../../components/common/EmptyState';
import { QuestionListItem } from '../../components/question/QuestionListItem';
import { getUserProfileApi, getUserQuestionsApi } from '../../services/api/userApi';
import type { QuestionListResult } from '../../types';

const PAGE_SIZE = 20;

function UserQuestionsContent({ userId }: { userId: number }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const [result, setResult] = useState<QuestionListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 面包屑展示用户名，失败时回退为「用户」
  const [profileName, setProfileName] = useState('用户');

  useEffect(() => {
    let active = true;
    getUserProfileApi(userId)
      .then((profile) => {
        if (active) setProfileName(profile.username);
      })
      .catch(() => {
        /* 用户名仅作展示，加载失败保持默认即可 */
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getUserQuestionsApi(userId, { page, pageSize: PAGE_SIZE })
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
  }, [userId, page]);

  const changePage = useCallback(
    (nextPage: number) => {
      setSearchParams(nextPage === 1 ? {} : { page: String(nextPage) });
    },
    [setSearchParams],
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: '首页', to: '/' },
          { label: profileName, to: `/users/${userId}` },
          { label: '提问' },
        ]}
      />
      <nav className="me-nav">
        <Link to={`/users/${userId}`}>个人主页</Link>
        <Link to={`/users/${userId}/answers`}>TA 的回答</Link>
      </nav>

      {loading ? (
        <p className="hint">加载中...</p>
      ) : error ? (
        <EmptyState title={error} />
      ) : !result || result.items.length === 0 ? (
        <EmptyState title="TA 还没有提问" description="这里空空如也" />
      ) : (
        <>
          <div className="question-list">
            {result.items.map((question) => (
              <QuestionListItem key={question.id} question={question} />
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

export function UserQuestionsPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return <EmptyState title="用户 ID 不合法" />;
  }
  return <UserQuestionsContent userId={userId} />;
}
