import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RequireAuth } from '../../components/common/RequireAuth';
import { EmptyState } from '../../components/common/EmptyState';
import { getMyProfileApi } from '../../services/api/userApi';
import type { UserProfile } from '../../types';

function MeContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyProfileApi()
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
  }, []);

  if (loading) {
    return <p className="hint">加载中...</p>;
  }
  if (error || !profile) {
    return <EmptyState title={error ?? '加载失败'} />;
  }

  return (
    <div>
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
        <Link to="/me/questions">我的提问</Link>
        <Link to="/me/answers">我的回答</Link>
        <Link to="/me/points">我的积分</Link>
      </nav>
    </div>
  );
}

export function MePage() {
  return (
    <RequireAuth>
      <MeContent />
    </RequireAuth>
  );
}
