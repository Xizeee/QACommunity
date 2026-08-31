import { AnswerSummary } from '../../types';
import { AnswerCard } from './AnswerCard';

interface AnswerListProps {
  answers: AnswerSummary[];
  currentUserId: number | undefined;
  onUpdated: (answer: AnswerSummary) => Promise<void>;
  onDeleted: (answerId: number) => Promise<void>;
}

export function AnswerList({
  answers,
  currentUserId,
  onUpdated,
  onDeleted,
}: AnswerListProps) {
  if (answers.length === 0) {
    return <p className="hint">暂无回答，来写下第一个回答吧。</p>;
  }
  return (
    <div className="answer-list">
      {answers.map((answer) => (
        <AnswerCard
          key={answer.id}
          answer={answer}
          isOwner={answer.author.id === currentUserId}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}
