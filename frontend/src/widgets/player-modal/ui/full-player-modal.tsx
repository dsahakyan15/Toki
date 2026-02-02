"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Heart, Plus, SkipForward, SkipBack } from "lucide-react";
import { usePlayerStore } from "@/features/track-playback";
import { getTrack } from "@/entities/track";
import { toggleLike } from "@/features/track-like";
import { vinylSpin, slideUp } from "@/shared/lib";

interface FullPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FullPlayerModal({ isOpen, onClose }: FullPlayerModalProps) {
  const { currentTrack, isPlaying, progress, duration, pause, resume, seek, queue } =
    usePlayerStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    if (currentTrack && isOpen) {
      getTrack(currentTrack.id)
        .then((data) => setIsLiked(data.isLiked))
        .catch((error) => console.error("Failed to fetch track details:", error));
    }
  }, [currentTrack, isOpen]);

  if (!currentTrack) {
    return null;
  }

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const response = await toggleLike(currentTrack.id);
      setIsLiked(response.liked);
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number.parseFloat(event.target.value);
    const newSeconds = (newProgress / 100) * duration;
    seek(newSeconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentSeconds = (progress / 100) * duration;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative w-full max-w-md mx-4 bg-cream rounded-3xl shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-gray-600 hover:bg-white"
              aria-label="Close player"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large vinyl record */}
            <div className="flex justify-center mb-8">
              <motion.div
                className="relative w-[200px] h-[200px]"
                variants={vinylSpin}
                animate={isPlaying ? "spinning" : "stopped"}
                style={{ willChange: "transform" }}
              >
                {/* Outer vinyl disc */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-8 border-gray-800 shadow-2xl">
                  {/* Vinyl grooves */}
                  <div className="absolute inset-3 rounded-full border border-gray-700 opacity-30" />
                  <div className="absolute inset-6 rounded-full border border-gray-700 opacity-20" />
                  <div className="absolute inset-9 rounded-full border border-gray-700 opacity-10" />

                  {/* Center label */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#FFB89D] border-4 border-gray-700 overflow-hidden flex items-center justify-center">
                    {currentTrack.coverUrl ? (
                      <img
                        src={currentTrack.coverUrl}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FFB89D] to-[#D97D55]" />
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Track info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {currentTrack.title}
              </h2>
              <p className="text-lg text-gray-600">{currentTrack.artist}</p>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-white/70 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary-blue [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>{formatTime(currentSeconds)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Skip back (disabled if no previous) */}
              <button
                className="w-12 h-12 rounded-full bg-white/70 flex items-center justify-center text-gray-400 cursor-not-allowed"
                disabled
                aria-label="Previous track"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Play/Pause */}
              <motion.button
                onClick={isPlaying ? pause : resume}
                className="w-16 h-16 rounded-full bg-primary-blue text-white flex items-center justify-center shadow-lg"
                whileTap={{ scale: 0.9 }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                )}
              </motion.button>

              {/* Skip forward */}
              <button
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  queue.length > 0
                    ? "bg-white/70 text-gray-600 hover:bg-white"
                    : "bg-white/70 text-gray-400 cursor-not-allowed"
                }`}
                disabled={queue.length === 0}
                aria-label="Next track"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-3">
              {/* Like button */}
              <motion.button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm ${
                  isLiked
                    ? "bg-primary-blue text-white"
                    : "bg-white/70 text-gray-700 hover:bg-white"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Heart
                  className="w-4 h-4"
                  fill={isLiked ? "currentColor" : "none"}
                />
                {isLiked ? "Liked" : "Like"}
              </motion.button>

              {/* Add to playlist button */}
              <motion.button
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/70 text-gray-700 font-semibold text-sm hover:bg-white"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // TODO: Open playlist selector modal
                  console.log("Add to playlist clicked");
                }}
              >
                <Plus className="w-4 h-4" />
                Playlist
              </motion.button>
            </div>

            {/* Queue info */}
            {queue.length > 0 && (
              <div className="mt-4 text-center text-xs text-gray-500">
                {queue.length} track{queue.length !== 1 ? "s" : ""} in queue
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
