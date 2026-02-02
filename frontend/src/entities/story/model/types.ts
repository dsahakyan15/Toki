export interface Story {
  id: number;
  userId: number;
  trackId: number;
  startTime: number;
  endTime: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatarUrl?: string;
  };
  track: {
    id: number;
    title: string;
    artist: string;
    coverUrl?: string;
    fileUrl: string;
  };
  isViewed?: boolean;
}
