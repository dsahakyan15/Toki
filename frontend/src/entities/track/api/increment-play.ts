import apiClient from '@/shared/api/client';

/**
 * Increment play count
 */
export async function incrementPlay(trackId: number): Promise<{ id: number; playCount: number }> {
  const response = await apiClient.post(`/api/tracks/${trackId}/play`);
  return response.data;
}
