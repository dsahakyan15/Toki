"use client";

import { Track } from "../model/types";
import { SpinningVinyl } from "./spinning-vinyl";
import { Heart, Pause, Play, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cardFadeIn } from "@/shared/lib";

interface TrackCardProps {
  track: Track;
  isPlaying?: boolean;
  onPlay?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  onAdd?: () => void;
  onOpen?: () => void;
}

export function TrackCard({
  track,
  isPlaying = false,
  onPlay,
  onLike,
  isLiked = false,
  onAdd,
  onOpen,
}: TrackCardProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.();
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd?.();
  };

  return (
    <motion.div
      variants={cardFadeIn}
      initial="hidden"
      animate="visible"
      className="bg-white/50 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      {/* Vinyl Cover */}
      <div className="flex-shrink-0">
        <SpinningVinyl
          imageUrl={track.coverUrl}
          size="medium"
          isSpinning={isPlaying}
          alt={`${track.title} cover`}
        />
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 truncate">{track.title}</h3>
        <p className="text-sm text-gray-600 truncate">{track.artist}</p>
        {track.duration && (
          <p className="text-xs text-gray-400 mt-1">
            {Math.floor(track.duration / 60)}:
            {(track.duration % 60).toString().padStart(2, "0")}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {onAdd && (
          <motion.button
            onClick={handleAdd}
            className="p-2 rounded-full bg-white/60 text-gray-600 hover:bg-white/90 transition-colors"
            whileTap={{ scale: 0.9 }}
            aria-label="Add to playlist"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        )}

        {/* Like Button */}
        <motion.button
          onClick={handleLike}
          className={`p-2 rounded-full transition-colors ${
            isLiked
              ? "bg-terracotta text-white"
              : "bg-white/50 text-gray-600 hover:bg-white/80"
          }`}
          whileTap={{ scale: 0.9 }}
        >
          <Heart
            className="w-5 h-5"
            fill={isLiked ? "currentColor" : "none"}
          />
        </motion.button>

        {/* Play Button */}
        <motion.button
          onClick={handlePlay}
          className="w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center shadow-md hover:bg-primary-blue/90 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
