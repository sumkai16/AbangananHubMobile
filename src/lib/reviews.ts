import { api } from './api';
import type { Review } from './properties';

export async function submitReview(payload: {
  property_id: number;
  rating: number;
  review_comment?: string;
}): Promise<Review> {
  const { data } = await api.post<{ data: Review }>('/reviews', payload);
  return data.data;
}
