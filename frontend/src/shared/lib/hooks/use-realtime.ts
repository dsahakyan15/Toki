"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useFeedStore } from "../store/feed-store";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socket: Socket | null = null;

/**
 * Hook to manage Socket.io connection and real-time updates
 */
export function useRealtime(userId?: number) {
  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("Socket.io connected:", socket?.id);
        if (userId) {
          socket?.emit("user:join", userId);
        }
      });

      socket.on("disconnect", () => {
        console.log("Socket.io disconnected");
      });

      socket.on("connect_error", (error) => {
        console.error("Socket.io connection error:", error);
      });
    }

    const handleNewStory = (story: unknown) => {
      console.log("New story received:", story);
      useFeedStore.getState().addStory(story as any);
    };

    const handleStoryDeleted = (storyId: number) => {
      console.log("Story deleted:", storyId);
      useFeedStore.getState().removeStory(storyId);
    };

    socket.on("story:new", handleNewStory);
    socket.on("story:deleted", handleStoryDeleted);

    return () => {
      socket?.off("story:new", handleNewStory);
      socket?.off("story:deleted", handleStoryDeleted);
    };
  }, [userId]);

  return socket;
}

/**
 * Emit story creation event
 */
export function emitStoryCreate(story: unknown) {
  socket?.emit("story:create", story);
}

/**
 * Emit story deletion event
 */
export function emitStoryDelete(storyId: number) {
  socket?.emit("story:delete", storyId);
}

/**
 * Get socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}
