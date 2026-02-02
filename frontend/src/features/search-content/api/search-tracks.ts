import apiClient from "@/shared/api/client";
import { Track } from "@/entities/track";

export async function searchTracks(query: string, limit: number = 20): Promise<Track[]> {
  const response = await apiClient.get("/api/tracks/search", {
    params: { q: query, limit },
  });
  return response.data;
}
