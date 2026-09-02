import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Sidebar } from '../components/common/Sidebar';

export function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // 仅在内容型页面（首页 / 问题详情）展示侧栏，登录、表单等页面保持单列
  const isHome = pathname === '/';
  const isQuestionDetail = /^\/questions\/\d+$/.test(pathname);
  const showSidebar = isHome || isQuestionDetail;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            问答社区
          </Link>
          <nav className="header-auth">
            {user ? (
              <>
                <Link to="/me" className="user-brief">
                  {user.username}（积分 {user.points}）
                </Link>
                <button type="button" className="button-ghost" onClick={handleLogout}>
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="link">
                  登录
                </Link>
                <Link to="/register" className="link">
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className={showSidebar ? 'layout' : 'layout layout-single'}>
        <main className="main">
          <Outlet />
        </main>
        {showSidebar && (
          <aside className="sidebar">
            <Sidebar />
          </aside>
        )}
      </div>
    </div>
  );
}
