"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Search, X } from "lucide-react";
import { searchTracks } from "../api/search-tracks";
import { Track } from "@/entities/track";
import { slideUp } from "@/shared/lib";

interface SearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackPlay?: (track: Track) => void;
  onTrackSelect?: (track: Track) => void;
  trackActionLabel?: string;
}

export function SearchSheet({
  isOpen,
  onClose,
  onTrackPlay,
  onTrackSelect,
  trackActionLabel,
}: SearchSheetProps) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const trimmedQuery = query.trim();
  const actionLabel = trackActionLabel ?? (onTrackSelect ? "Select" : "Play");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setTracks([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!trimmedQuery) {
      setTracks([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchTracks(trimmedQuery, 20);
        setTracks(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [trimmedQuery]);

  const emptyMessage = useMemo(() => {
    if (!trimmedQuery) return "Start typing to search";
    if (isLoading) return "Searching...";
    return "No results found";
  }, [isLoading, trimmedQuery]);

  const handleSelect = (track: Track) => {
    if (onTrackSelect) {
      onTrackSelect(track);
    } else {
      onTrackPlay?.(track);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="w-full bg-cream rounded-t-3xl p-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 rounded-full bg-white/70 px-4 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search tracks"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-gray-500"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center text-gray-600"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {tracks.length > 0 ? (
                <div className="space-y-2">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary-blue/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music2 className="w-5 h-5 text-primary-blue" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {track.title}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {track.artist}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSelect(track)}
                        className="rounded-full bg-primary-blue/10 px-3 py-1 text-xs font-semibold text-primary-blue"
                      >
                        {actionLabel}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">{emptyMessage}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
