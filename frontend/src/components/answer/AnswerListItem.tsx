import { Link } from 'react-router-dom';
import { UserAnswerSummary } from '../../types';
import { MarkdownContent } from '../common/MarkdownContent';
import { formatDate } from '../../utils/format';

// 只读回答卡片（含所属问题标题）：用于「我的回答」与公开用户主页的回答列表（PRD 20.3）
export function AnswerListItem({ answer }: { answer: UserAnswerSummary }) {
  return (
    <article className="answer-card">
      <div className="answer-card-head">
        <Link to={`/questions/${answer.questionId}`} className="question-title">
          {answer.questionTitle}
        </Link>
        {answer.status === 'ACCEPTED' && <span className="badge-solved">已采纳</span>}
      </div>
      <MarkdownContent content={answer.content} />
      <div className="answer-card-footer">
        <span>👍 {answer.likeCount}</span>
        <span className="meta-author">{formatDate(answer.createdAt)}</span>
      </div>
    </article>
  );
}
