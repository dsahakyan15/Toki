import { Track } from '@/entities/track/model/types';

export interface Playlist {
  id: number;
  title: string;
  createdAt: string;
  _count?: { items: number };
  items?: Array<{ id: number; track: Track }>;
}
