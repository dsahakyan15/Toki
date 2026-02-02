import { apiClient } from "@/shared/api";
import { UserProfile, UserSearchResult } from "../model/types";
import { Track } from "@/entities/track";

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const response = await apiClient.get(`/api/social/users/${userId}`);
  return response.data;
}

export async function getUserLikes(userId: number): Promise<Array<{ track: Track }>> {
  const response = await apiClient.get(`/api/social/users/${userId}/likes`);
  return response.data;
}

export async function getUserPlaylists(
  userId: number
): Promise<Array<{ id: number; title: string; _count?: { items: number } }>> {
  const response = await apiClient.get(`/api/social/users/${userId}/playlists`);
  return response.data;
}

export async function getUserFriends(userId: number): Promise<UserSearchResult[]> {
  const response = await apiClient.get(`/api/social/users/${userId}/friends`);
  return response.data;
}
