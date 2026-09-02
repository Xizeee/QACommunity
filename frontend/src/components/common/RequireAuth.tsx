import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

// 需要登录的页面守卫：处理加载中 / 未登录 / 已登录三种状态（PRD 23）
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);

  if (status === 'idle' || status === 'loading') {
    return <p className="hint">加载中...</p>;
  }
  if (status === 'guest') {
    return (
      <div className="empty-state">
        <p className="empty-title">请先登录后继续</p>
        <p className="empty-desc">
          <Link to="/login" className="primary-link">
            去登录
          </Link>
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
