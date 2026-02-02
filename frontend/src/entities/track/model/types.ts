export interface Track {
  id: number;
  title: string;
  artist: string;
  fileUrl: string;
  coverUrl?: string;
  duration?: number;
  uploadedBy?: number;
  playCount?: number;
}
