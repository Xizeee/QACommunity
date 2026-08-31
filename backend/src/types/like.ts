export type LikeTargetType = 'QUESTION' | 'ANSWER';

// 数据库 likes 行对应的完整记录，仅在后端内部使用
export interface LikeRecord {
  id: number;
  userId: number;
  targetType: LikeTargetType;
  targetId: number;
  createdAt: Date;
}
