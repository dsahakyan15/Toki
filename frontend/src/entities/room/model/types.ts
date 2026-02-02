import { Track } from '@/entities/track/model/types';
import { User } from '@/entities/user/model/types';

export interface Room {
  id: number;
  name: string;
  hostId: number;
  createdAt: string;
  host?: User;
}

export interface RoomQueueItem {
  id: number;
  track: Track;
  isPlaying: boolean;
  position: number;
}

export interface PlaybackState {
  trackId: number;
  startedAt: number;
}
