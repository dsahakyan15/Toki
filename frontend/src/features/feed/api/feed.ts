import { apiClient } from "@/shared/api";
import { Track } from "@/entities/track";
import { Story } from "@/entities/story";

export async function getStories(): Promise<Story[]> {
  const response = await apiClient.get("/api/feed/stories");
  return response.data;
}

export async function getTopChart(): Promise<Track[]> {
  const response = await apiClient.get("/api/feed/top-chart");
  return response.data;
}

export async function getForYouFeed(offset: number = 0, limit: number = 20): Promise<Track[]> {
  const response = await apiClient.get("/api/feed/for-you", {
    params: { offset, limit },
  });
  return response.data;
}
