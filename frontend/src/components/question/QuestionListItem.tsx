import { Link } from 'react-router-dom';
import { QuestionSummary } from '../../types';
import { formatDate } from '../../utils/format';

// 只读问题卡片：用于「我的提问」与公开用户主页的问题列表（PRD 20.2）
export function QuestionListItem({ question }: { question: QuestionSummary }) {
  return (
    <article className="question-card">
      <div className="question-card-head">
        <Link to={`/questions/${question.id}`} className="question-title">
          {question.title}
        </Link>
        {question.status === 'SOLVED' && <span className="badge-solved">已解决</span>}
      </div>
      <div className="question-card-meta">
        <span>💬 {question.answerCount}</span>
        <span>👍 {question.likeCount}</span>
        <span className="meta-author">{formatDate(question.createdAt)}</span>
      </div>
    </article>
  );
}
