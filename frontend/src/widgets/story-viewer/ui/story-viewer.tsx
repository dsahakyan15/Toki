"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Trash2 } from "lucide-react";
import { SpinningVinyl } from "@/entities/track";
import { Story } from "@/entities/story";

interface StoryViewerProps {
  story: Story | null;
  isOpen: boolean;
  isOwner: boolean;
  onClose: () => void;
  onDelete?: (storyId: number) => void;
  onLike?: (storyId: number) => void;
}

export function StoryViewer({
  story,
  isOpen,
  isOwner,
  onClose,
  onDelete,
  onLike,
}: StoryViewerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!story || !isOpen) {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(story.track.fileUrl);
    } else {
      audioRef.current.src = story.track.fileUrl;
    }

    const audio = audioRef.current;
    audio.currentTime = story.startTime;
    audio.volume = 0.9;

    const duration = Math.max(0, story.endTime - story.startTime);
    let timeoutId: number | null = null;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    audio
      .play()
      .then(() => {
        timeoutId = window.setTimeout(() => {
          audio.pause();
          audio.currentTime = story.startTime;
        }, duration * 1000);
      })
      .catch((error) => {
        console.error("Failed to play story audio:", error);
      });

    return () => {
      audio.pause();
      audio.currentTime = story.startTime;
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isOpen, story]);

  if (!story) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="absolute top-6 left-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">Vinyl Story</p>
            <p className="text-lg font-semibold text-white">
              {story.user.username || "User"}
            </p>
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-3">
            {isOwner && (
              <button
                onClick={() => onDelete?.(story.id)}
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
                aria-label="Delete story"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
              aria-label="Close story"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-6">
            <SpinningVinyl
              imageUrl={story.track.coverUrl}
              size="large"
              isSpinning={isPlaying}
              alt={`${story.track.title} cover`}
            />

            <div className="text-center text-white">
              <p className="text-xl font-semibold">{story.track.title}</p>
              <p className="text-sm text-white/70">{story.track.artist}</p>
              <p className="text-xs text-white/50 mt-2">
                {story.startTime}s - {story.endTime}s
              </p>
            </div>

            <button
              onClick={() => onLike?.(story.id)}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white"
            >
              <Heart className="w-4 h-4" />
              Like story
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
