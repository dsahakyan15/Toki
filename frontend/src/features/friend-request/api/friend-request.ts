import apiClient from '@/shared/api/client';

export async function sendFriendRequest(addresseeId: number): Promise<{ message: string; status: string }> {
  const response = await apiClient.post('/api/social/friends/request', {
    addresseeId,
  });
  return response.data;
}

export async function acceptFriendRequest(requesterId: number): Promise<{ message: string; status: string }> {
  const response = await apiClient.post('/api/social/friends/accept', {
    requesterId,
  });
  return response.data;
}

export async function getFriendRequests(): Promise<
  Array<{ id: number; requester: { id: number; username: string | null; avatarUrl?: string } }>
> {
  const response = await apiClient.get('/api/social/friends/requests');
  return response.data;
}
