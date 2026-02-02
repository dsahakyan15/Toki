import apiClient from "@/shared/api/client";
import { UserSearchResult } from "@/entities/user";

export async function searchUsers(query: string, limit: number = 20): Promise<UserSearchResult[]> {
  const response = await apiClient.get("/api/social/users/search", {
    params: { q: query, limit },
  });
  return response.data;
}
