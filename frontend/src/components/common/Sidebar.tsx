import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTagsApi } from '../../services/api/tagApi';
import type { TagWithCount } from '../../types';

const MAX_TAGS = 10;

// 右侧栏：热门标签 + 社区指引。仅作为视觉与导航补充，不新增业务逻辑。
// 数据来自已有的 getTagsApi（后端已按问题数倒序），加载失败时静默隐藏。
export function Sidebar() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [searchParams] = useSearchParams();
  const activeTag = searchParams.get('tag') ?? '';

  useEffect(() => {
    let active = true;
    getTagsApi()
      .then((data) => {
        if (active) {
          setTags(data);
        }
      })
      .catch(() => {
        // 标签仅作引导展示，加载失败直接留空即可
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="sidebar-card">
        <h2 className="sidebar-title">热门标签</h2>
        <div className="sidebar-list">
          {tags.slice(0, MAX_TAGS).map((tag) => (
            <Link
              key={tag.id}
              to={tag.name === activeTag ? '/' : `/?tag=${encodeURIComponent(tag.name)}`}
              className="sidebar-tag"
              aria-current={tag.name === activeTag ? 'page' : undefined}
            >
              <span className="tag-name">{tag.name}</span>
              <span className="tag-count">{tag.questionCount}</span>
            </Link>
          ))}
        </div>
        <p className="sidebar-footer">点击标签查看相关问题</p>
      </section>

      <section className="sidebar-card">
        <h2 className="sidebar-title">社区指引</h2>
        <p className="sidebar-guide">
          提问前请先搜索，或许你的问题已被解答。内容支持{' '}
          <Link to="/questions/ask">发布问题</Link>，高质量回答可获得积分与采纳。
        </p>
      </section>
    </>
  );
}
