"use client";

import { create } from "zustand";

interface FeedTrack {
  id: number;
  title: string;
  artist: string;
  fileUrl: string;
  coverUrl?: string;
  duration?: number;
  playCount?: number;
  likesCount?: number;
}

interface FeedStory {
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

interface FeedState {
  stories: FeedStory[];
  topChart: FeedTrack[];
  forYouFeed: FeedTrack[];
  forYouOffset: number;
  isLoadingMore: boolean;
  setStories: (stories: FeedStory[]) => void;
  setTopChart: (tracks: FeedTrack[]) => void;
  setForYouFeed: (tracks: FeedTrack[]) => void;
  appendForYouFeed: (tracks: FeedTrack[]) => void;
  setForYouOffset: (offset: number) => void;
  setIsLoadingMore: (isLoading: boolean) => void;
  addStory: (story: FeedStory) => void;
  removeStory: (storyId: number) => void;
  markStoryViewed: (storyId: number) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  stories: [],
  topChart: [],
  forYouFeed: [],
  forYouOffset: 0,
  isLoadingMore: false,
  setStories: (stories) => set({ stories }),
  setTopChart: (tracks) => set({ topChart: tracks }),
  setForYouFeed: (tracks) => set({ forYouFeed: tracks }),
  appendForYouFeed: (tracks) =>
    set((state) => ({ forYouFeed: [...state.forYouFeed, ...tracks] })),
  setForYouOffset: (offset) => set({ forYouOffset: offset }),
  setIsLoadingMore: (isLoading) => set({ isLoadingMore: isLoading }),
  addStory: (story) => set((state) => ({ stories: [story, ...state.stories] })),
  removeStory: (storyId) =>
    set((state) => ({ stories: state.stories.filter((story) => story.id !== storyId) })),
  markStoryViewed: (storyId) =>
    set((state) => ({
      stories: state.stories.map((story) =>
        story.id === storyId ? { ...story, isViewed: true } : story
      ),
    })),
}));
