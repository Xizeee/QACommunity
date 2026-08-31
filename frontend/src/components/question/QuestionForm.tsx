import { FormEvent, useState } from 'react';
import { QuestionContentPayload, TagWithCount } from '../../types';

interface QuestionFormProps {
  tags: TagWithCount[];
  initial?: QuestionContentPayload;
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: QuestionContentPayload) => void;
  submitLabel: string;
}

const MIN_TAGS = 1;
const MAX_TAGS = 5;

export function QuestionForm({
  tags,
  initial,
  submitting,
  error,
  onSubmit,
  submitLabel,
}: QuestionFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initial?.tagIds ?? []);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : current.length >= MAX_TAGS
          ? current
          : [...current, tagId],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const errors: string[] = [];
    if (title.trim().length < 5 || title.trim().length > 100) {
      errors.push('标题长度必须为 5～100 个字符');
    }
    if (content.trim().length === 0) {
      errors.push('内容不能为空');
    }
    if (selectedTagIds.length < MIN_TAGS || selectedTagIds.length > MAX_TAGS) {
      errors.push(`请选择 ${MIN_TAGS}～${MAX_TAGS} 个标签`);
    }
    if (errors.length > 0) {
      setFormError(errors.join('；'));
      return;
    }
    onSubmit({ title: title.trim(), content, tagIds: selectedTagIds });
  };

  const displayError = formError ?? error;

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <label>
        标题
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="用一句话描述你的问题（5～100 个字符）"
        />
      </label>
      <label>
        内容（支持 Markdown）
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="详细描述你的问题，支持 Markdown、代码块和链接"
        />
      </label>
      <div className="tag-select">
        <span className="tag-select-label">
          标签（已选 {selectedTagIds.length}/{MAX_TAGS}）
        </span>
        <div className="tag-select-options">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`tag-option ${selectedTagIds.includes(tag.id) ? 'active' : ''}`}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
      {displayError && <p className="form-error">{displayError}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? '提交中...' : submitLabel}
      </button>
    </form>
  );
}
