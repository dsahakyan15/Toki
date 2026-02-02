export interface NotificationItem {
  id: number;
  userId: number;
  type: string;
  title: string;
  message?: string | null;
  isRead: boolean;
  createdAt: string;
  relatedUserId?: number | null;
  relatedStoryId?: number | null;
  relatedRoomId?: number | null;
}
