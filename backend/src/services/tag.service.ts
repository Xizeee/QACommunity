import { tagRepository } from '../repositories/tag.repository';
import { TagWithCount } from '../types/question';

export const tagService = {
  async listTags(): Promise<TagWithCount[]> {
    return tagRepository.listWithQuestionCount();
  },
};
