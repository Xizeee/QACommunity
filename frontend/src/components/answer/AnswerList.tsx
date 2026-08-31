import { AnswerSummary } from '../../types';
import { AnswerCard } from './AnswerCard';

interface AnswerListProps {
  answers: AnswerSummary[];
  currentUserId: number | undefined;
  likedAnswerIds: Set<number>;
  canAccept: boolean;
  onAccept: (answerId: number) => Promise<void>;
  onUpdated: (answer: AnswerSummary) => Promise<void>;
  onDeleted: (answerId: number) => Promise<void>;
}

export function AnswerList({
  answers,
  currentUserId,
  likedAnswerIds,
  canAccept,
  onAccept,
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
          liked={likedAnswerIds.has(answer.id)}
          canAccept={canAccept}
          onAccept={onAccept}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  );
}
