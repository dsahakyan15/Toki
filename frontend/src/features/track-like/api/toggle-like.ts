import apiClient from '@/shared/api/client';

export async function toggleLike(trackId: number): Promise<{ liked: boolean; message: string }> {
  const response = await apiClient.post(`/api/tracks/${trackId}/like`);
  return response.data;
}
