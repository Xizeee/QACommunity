import { TagBrief } from '../../types';

interface TagListProps {
  tags: TagBrief[];
  onTagClick?: (name: string) => void;
}

export function TagList({ tags, onTagClick }: TagListProps) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className="tag-list">
      {tags.map((tag) =>
        onTagClick ? (
          <button
            key={tag.id}
            type="button"
            className="tag"
            onClick={() => onTagClick(tag.name)}
          >
            {tag.name}
          </button>
        ) : (
          <span key={tag.id} className="tag">
            {tag.name}
          </span>
        ),
      )}
    </div>
  );
}
