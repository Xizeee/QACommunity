import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === 'idle' || status === 'loading') {
    return <p className="hint">加载中...</p>;
  }

  return (
    <section className="card">
      {user ? (
        <>
          <h2>欢迎，{user.username}</h2>
          <p>当前积分：{user.points}</p>
        </>
      ) : (
        <>
          <h2>欢迎使用问答社区</h2>
          <p>
            你还未登录，请先 <Link to="/login">登录</Link> 或{' '}
            <Link to="/register">注册</Link>
          </p>
        </>
      )}
    </section>
  );
}
