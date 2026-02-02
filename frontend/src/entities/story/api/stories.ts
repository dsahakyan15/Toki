import { apiClient } from "@/shared/api";
import { Story } from "../model/types";

export async function createStory(data: {
  trackId: number;
  startTime: number;
  endTime: number;
}): Promise<Story> {
  const response = await apiClient.post("/api/stories", data);
  return response.data;
}

export async function deleteStory(storyId: number): Promise<{ message: string }> {
  const response = await apiClient.delete(`/api/stories/${storyId}`);
  return response.data;
}

export async function markStoryViewed(storyId: number): Promise<void> {
  await apiClient.post(`/api/stories/${storyId}/view`);
}

export async function toggleStoryLike(storyId: number): Promise<{ liked: boolean; message: string }> {
  const response = await apiClient.post(`/api/stories/${storyId}/like`);
  return response.data;
}
