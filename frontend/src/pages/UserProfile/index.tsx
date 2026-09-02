import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { EmptyState } from '../../components/common/EmptyState';
import { getUserProfileApi } from '../../services/api/userApi';
import type { PublicUserProfile } from '../../types';

function UserProfileContent({ userId }: { userId: number }) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getUserProfileApi(userId)
      .then((data) => {
        if (active) setProfile(data);
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
  }, [userId]);

  if (loading) {
    return <p className="hint">加载中...</p>;
  }
  if (error || !profile) {
    return <EmptyState title={error ?? '加载失败'} />;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: '首页', to: '/' }, { label: profile.username }]} />
      <section className="profile-card">
        <div className="profile-head">
          <div className="profile-avatar">{profile.username.charAt(0).toUpperCase()}</div>
          <div className="profile-info">
            <h1 className="profile-name">{profile.username}</h1>
            <p className="profile-bio">{profile.bio || '这个人很懒，还没有填写简介'}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{profile.points}</span>
            <span className="stat-label">积分</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.questionCount}</span>
            <span className="stat-label">提问</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.answerCount}</span>
            <span className="stat-label">回答</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profile.likeCount}</span>
            <span className="stat-label">获赞</span>
          </div>
        </div>
      </section>

      <nav className="me-nav">
        <Link to={`/users/${userId}/questions`}>TA 的提问</Link>
        <Link to={`/users/${userId}/answers`}>TA 的回答</Link>
      </nav>
    </div>
  );
}

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return <EmptyState title="用户 ID 不合法" />;
  }
  return <UserProfileContent userId={userId} />;
}
