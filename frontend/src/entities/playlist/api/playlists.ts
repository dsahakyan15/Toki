import { apiClient } from "@/shared/api";
import { Playlist } from "../model/types";

export async function getPlaylists(): Promise<Playlist[]> {
  const response = await apiClient.get("/api/playlists");
  return response.data;
}

export async function createPlaylist(title: string): Promise<Playlist> {
  const response = await apiClient.post("/api/playlists", { title });
  return response.data;
}

export async function addTrackToPlaylist(
  playlistId: number,
  trackId: number
): Promise<{ id: number }> {
  const response = await apiClient.post(`/api/playlists/${playlistId}/items`, {
    trackId,
  });
  return response.data;
}

export async function getPlaylist(playlistId: number): Promise<Playlist> {
  const response = await apiClient.get(`/api/playlists/${playlistId}`);
  return response.data;
}
