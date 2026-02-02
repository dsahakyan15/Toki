import { apiClient } from "@/shared/api";
import { NotificationItem } from "../model/types";

export async function getNotifications(limit: number = 20): Promise<NotificationItem[]> {
  const response = await apiClient.get("/api/notifications", {
    params: { limit },
  });
  return response.data;
}

export async function markNotificationRead(notificationId: number): Promise<NotificationItem> {
  const response = await apiClient.post(`/api/notifications/${notificationId}/read`);
  return response.data;
}
