import { http } from '../http';
import type { ApiSuccess, TagWithCount } from '../../types';

export async function getTagsApi(): Promise<TagWithCount[]> {
  const response = await http.get<ApiSuccess<{ tags: TagWithCount[] }>>('/tags');
  return response.data.data.tags;
}
