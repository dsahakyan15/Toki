import { apiClient } from "@/shared/api";
import { Track } from "@/entities/track";

export interface RoomParticipant {
  id: number;
  user: {
    id: number;
    username: string | null;
    avatarUrl?: string;
  };
  canControlQueue: boolean;
}

export interface RoomQueueItem {
  id: number;
  track: Track;
  isPlaying: boolean;
  position: number;
}

export interface RoomState {
  id: number;
  hostId: number;
  name?: string | null;
  participants: RoomParticipant[];
  queue: RoomQueueItem[];
  currentTrackId?: number | null;
}

export async function createRoom(name?: string): Promise<RoomState> {
  const response = await apiClient.post("/api/rooms", { name });
  return response.data;
}

export async function getRoom(roomId: number): Promise<RoomState> {
  const response = await apiClient.get(`/api/rooms/${roomId}`);
  return response.data;
}

export async function joinRoom(roomId: number): Promise<{ id: number }> {
  const response = await apiClient.post(`/api/rooms/${roomId}/join`);
  return response.data;
}

export async function leaveRoom(roomId: number): Promise<{ message: string }> {
  const response = await apiClient.post(`/api/rooms/${roomId}/leave`);
  return response.data;
}

export async function addToQueue(roomId: number, trackId: number): Promise<RoomQueueItem> {
  const response = await apiClient.post(`/api/rooms/${roomId}/queue`, { trackId });
  return response.data;
}

export async function updateQueuePermission(
  roomId: number,
  userId: number,
  canControlQueue: boolean
): Promise<RoomParticipant> {
  const response = await apiClient.post(`/api/rooms/${roomId}/permissions`, {
    userId,
    canControlQueue,
  });
  return response.data;
}
