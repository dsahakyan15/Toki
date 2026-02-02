export interface User {
  id: number;
  username: string | null;
  avatarUrl?: string;
  isPrivate: boolean;
  createdAt?: string;
}

export interface UserSearchResult {
  id: number;
  username: string | null;
  avatarUrl?: string;
  isPrivate: boolean;
  friendshipStatus?: "none" | "pending" | "friends" | "blocked";
}

export interface UserProfile {
  id: number;
  username: string | null;
  avatarUrl?: string;
  isPrivate: boolean;
  createdAt: string;
  relationship: "self" | "none" | "pending" | "friends" | "blocked";
  canViewFull: boolean;
  stats?: {
    likedTracksCount: number;
    playlistsCount: number;
    friendsCount: number;
  } | null;
}
