import { FormEvent, useState } from 'react';

interface AnswerFormProps {
  submitting: boolean;
  error: string | null;
  onSubmit: (content: string) => void;
}

export function AnswerForm({ submitting, error, onSubmit }: AnswerFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (content.trim().length === 0) {
      return;
    }
    onSubmit(content);
  };

  return (
    <form className="answer-form" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="写下你的回答（支持 Markdown）"
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={submitting || content.trim().length === 0}>
        {submitting ? '发布中...' : '发布回答'}
      </button>
    </form>
  );
}
