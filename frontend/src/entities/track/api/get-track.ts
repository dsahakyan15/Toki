import apiClient from '@/shared/api/client';
import { Track } from '../model/types';

/**
 * Get track by ID
 */
export async function getTrack(trackId: number): Promise<Track & { isLiked: boolean; likesCount: number }> {
  const response = await apiClient.get(`/api/tracks/${trackId}`);
  return response.data;
}
