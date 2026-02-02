'use client';

import { Track } from '@/entities/track';
import { SpinningVinyl } from '@/entities/track';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopChartProps {
  tracks: Track[];
  currentlyPlayingId?: number;
  onTrackClick: (track: Track) => void;
}

export function TopChart({ tracks, currentlyPlayingId, onTrackClick }: TopChartProps) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No tracks in the chart yet</p>
      </div>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-4">
        Top Chart
      </h2>
      <div className="space-y-2 px-4">
        {tracks.slice(0, 10).map((track, index) => {
          const isPlaying = track.id === currentlyPlayingId;

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/50 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-white/70 transition-colors"
              onClick={() => onTrackClick(track)}
            >
              {/* Rank Number */}
              <span className="text-2xl font-bold text-terracotta w-8 text-center">
                {index + 1}
              </span>

              {/* Vinyl Cover */}
              <SpinningVinyl
                imageUrl={track.coverUrl}
                size="small"
                isSpinning={isPlaying}
                alt={`${track.title} cover`}
              />

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {track.title}
                </p>
                <p className="text-sm text-gray-600 truncate">{track.artist}</p>
              </div>

              {/* Play Indicator */}
              {isPlaying && (
                <div className="flex items-center gap-1 text-primary-blue">
                  <div className="flex gap-0.5">
                    <div className="w-0.5 h-3 bg-current animate-pulse" />
                    <div className="w-0.5 h-4 bg-current animate-pulse delay-75" />
                    <div className="w-0.5 h-3 bg-current animate-pulse delay-150" />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
