import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\w\u4e00-\u9fa5-]+$/;

export function RegisterPage() {
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const errors: string[] = [];
    if (username.trim().length < 2 || username.trim().length > 20) {
      errors.push('用户名长度必须为 2～20 个字符');
    } else if (!USERNAME_PATTERN.test(username.trim())) {
      errors.push('用户名只能包含中文、字母、数字、下划线和连字符');
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      errors.push('邮箱格式不合法');
    }
    if (password.length < 6 || password.length > 72) {
      errors.push('密码长度必须为 6～72 个字符');
    }
    if (password !== confirmPassword) {
      errors.push('两次输入的密码不一致');
    }
    if (errors.length > 0) {
      setError(errors.join('；'));
      return;
    }

    setSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <h2>注册</h2>
      <form onSubmit={handleSubmit}>
        <label>
          用户名
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
          />
        </label>
        <label>
          邮箱
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          确认密码
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? '注册中...' : '注册'}
        </button>
      </form>
      <p className="hint">
        已有账号？<Link to="/login">去登录</Link>
      </p>
    </section>
  );
}
