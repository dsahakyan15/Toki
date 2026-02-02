"use client";

import { create } from "zustand";
import { Track } from "@/entities/track";
import { Howl } from "howler";
import { incrementPlay } from "@/entities/track";

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number; // 0-100
  duration: number; // seconds
  queue: Track[];
  howl: Howl | null;

  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  addToQueue: (track: Track) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  queue: [],
  howl: null,

  play: (track) => {
    const { howl: currentHowl } = get();

    // Stop current track if playing
    if (currentHowl) {
      currentHowl.stop();
      currentHowl.unload();
    }

    // Create new Howl instance
    const newHowl = new Howl({
      src: [track.fileUrl],
      html5: true,
      onplay: () => set({ isPlaying: true }),
      onpause: () => set({ isPlaying: false }),
      onstop: () => set({ isPlaying: false, progress: 0 }),
      onend: () => {
        set({ isPlaying: false, progress: 0 });
        // Auto-play next track in queue if exists
        const { queue } = get();
        if (queue.length > 0) {
          const nextTrack = queue[0];
          set({ queue: queue.slice(1) });
          get().play(nextTrack);
        }
      },
      onload: () => {
        const duration = newHowl.duration();
        set({ duration });
      },
    });

    newHowl.play();

    incrementPlay(track.id).catch((error) => {
      console.error("Failed to increment play count:", error);
    });

    set({
      currentTrack: track,
      howl: newHowl,
      isPlaying: true,
      progress: 0,
    });
  },

  pause: () => {
    const { howl } = get();
    if (howl) {
      howl.pause();
      set({ isPlaying: false });
    }
  },

  resume: () => {
    const { howl } = get();
    if (howl) {
      howl.play();
      set({ isPlaying: true });
    }
  },

  stop: () => {
    const { howl } = get();
    if (howl) {
      howl.stop();
      set({ isPlaying: false, progress: 0, currentTrack: null });
    }
  },

  seek: (seconds) => {
    const { howl } = get();
    if (howl) {
      howl.seek(seconds);
    }
  },

  addToQueue: (track) => {
    set((state) => ({
      queue: [...state.queue, track],
    }));
  },

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
}));
