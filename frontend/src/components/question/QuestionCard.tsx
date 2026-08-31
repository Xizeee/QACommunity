import { Link } from 'react-router-dom';
import { QuestionSummary } from '../../types';
import { TagList } from '../tag/TagList';
import { formatDate } from '../../utils/format';

interface QuestionCardProps {
  question: QuestionSummary;
  onTagClick?: (name: string) => void;
}

export function QuestionCard({ question, onTagClick }: QuestionCardProps) {
  return (
    <article className="question-card">
      <div className="question-card-head">
        <Link to={`/questions/${question.id}`} className="question-title">
          {question.title}
        </Link>
        {question.status === 'SOLVED' && <span className="badge-solved">已解决</span>}
      </div>
      <TagList tags={question.tags} onTagClick={onTagClick} />
      <div className="question-card-meta">
        <span>👍 {question.likeCount}</span>
        <span>💬 {question.answerCount}</span>
        <span>👁 {question.viewCount}</span>
        <span className="meta-author">
          {question.author.username} · {formatDate(question.createdAt)}
        </span>
      </div>
    </article>
  );
}
