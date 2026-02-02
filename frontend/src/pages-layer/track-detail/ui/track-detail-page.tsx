"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Heart, Pause, Play, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Track, getTrack } from "@/entities/track";
import { toggleLike } from "@/features/track-like";
import { createStory } from "@/entities/story";
import { emitStoryCreate, slideUp } from "@/shared/lib";
import { addTrackToPlaylist, createPlaylist, getPlaylists, Playlist } from "@/entities/playlist";
import { usePlayerStore } from "@/features/track-playback";

export default function TrackPage() {
  const params = useParams<{ id: string }>();
  const trackId = Number.parseInt(params.id, 10);
  const { currentTrack, isPlaying, play, pause, resume } = usePlayerStore();
  const [track, setTrack] = useState<(Track & { isLiked?: boolean; likesCount?: number }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);
  const [startTime, setStartTime] = useState(15);
  const [endTime, setEndTime] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");

  const isActiveTrack = useMemo(() => {
    if (!track || !currentTrack) return false;
    return track.id === currentTrack.id;
  }, [currentTrack, track]);

  useEffect(() => {
    if (!trackId || Number.isNaN(trackId)) {
      setError("Invalid track");
      setIsLoading(false);
      return;
    }

    const loadTrack = async () => {
      try {
        setIsLoading(true);
        const data = await getTrack(trackId);
        setTrack(data);
      } catch (err) {
        console.error("Failed to load track:", err);
        setError("Track not found");
      } finally {
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [trackId]);

  useEffect(() => {
    if (!isSheetOpen) return;

    setIsLoadingPlaylists(true);
    getPlaylists()
      .then((data) => setPlaylists(data))
      .catch((err) => console.error("Failed to load playlists:", err))
      .finally(() => setIsLoadingPlaylists(false));
  }, [isSheetOpen]);

  const handleToggleLike = async () => {
    if (!track) return;
    setTrack({ ...track, isLiked: !track.isLiked });
    try {
      await toggleLike(track.id);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handlePlay = () => {
    if (!track) return;
    if (!isActiveTrack) {
      play(track);
    } else if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleCreateStory = async () => {
    if (!track) return;
    setIsSubmitting(true);
    try {
      const story = await createStory({
        trackId: track.id,
        startTime,
        endTime,
      });
      emitStoryCreate(story);
      setIsStoryFormOpen(false);
      setIsSheetOpen(false);
    } catch (err) {
      console.error("Failed to create story:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    if (!track) return;
    try {
      await addTrackToPlaylist(playlistId, track.id);
      setIsSheetOpen(false);
    } catch (err) {
      console.error("Failed to add to playlist:", err);
    }
  };

  const handleCreatePlaylist = async () => {
    const title = newPlaylistTitle.trim();
    if (!title) return;
    try {
      const playlist = await createPlaylist(title);
      setPlaylists((prev) => [playlist, ...prev]);
      setNewPlaylistTitle("");
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-w-screen w-screen h-full flex items-center justify-center bg-cream">
        <div className="text-gray-600">Loading track...</div>
      </div>
    );
  }

  if (!track || error) {
    return (
      <div className="min-w-screen w-screen h-full flex items-center justify-center bg-cream">
        <div className="text-gray-600">{error || "Track not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-w-screen w-screen h-full flex flex-col bg-cream px-6 pt-10">
      <div className="flex-1 flex flex-col items-center text-center">
        <div className="w-64 h-64 rounded-full bg-black/90 overflow-hidden shadow-2xl flex items-center justify-center">
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-40 h-40 rounded-full object-cover"
            />
          ) : (
            <div className="w-40 h-40 rounded-full bg-primary-blue/70" />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-gray-900">{track.title}</h1>
        <p className="text-sm text-gray-600 mt-1">{track.artist}</p>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleToggleLike}
            className={`w-12 h-12 rounded-full flex items-center justify-center border transition ${
              track.isLiked
                ? "bg-terracotta text-white border-terracotta"
                : "bg-white/70 text-gray-600 border-white"
            }`}
            aria-label="Like track"
          >
            <Heart className="w-5 h-5" fill={track.isLiked ? "currentColor" : "none"} />
          </button>

          <button
            onClick={handlePlay}
            className="w-16 h-16 rounded-full bg-primary-blue text-white flex items-center justify-center shadow-lg"
            aria-label="Play track"
          >
            {isActiveTrack && isPlaying ? (
              <Pause className="w-6 h-6" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={() => setIsSheetOpen(true)}
            className="w-12 h-12 rounded-full bg-white/70 text-gray-600 flex items-center justify-center border border-white"
            aria-label="Add to playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSheetOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="w-full bg-cream rounded-t-3xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add to</h2>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setIsStoryFormOpen(true)}
                  className="w-full rounded-2xl bg-white/80 px-4 py-3 text-left"
                >
                  <p className="text-sm font-semibold text-gray-900">Add to Story</p>
                  <p className="text-xs text-gray-500">Trim a 15-30s clip</p>
                </button>

                <div className="rounded-2xl bg-white/80 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Add to Playlist</p>
                  <p className="text-xs text-gray-500">Choose a playlist</p>
                  <div className="mt-3 space-y-2">
                    {isLoadingPlaylists ? (
                      <p className="text-xs text-gray-500">Loading playlists...</p>
                    ) : playlists.length > 0 ? (
                      playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => handleAddToPlaylist(playlist.id)}
                          className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm text-gray-700 hover:bg-white/90"
                        >
                          {playlist.title}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500">No playlists yet.</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newPlaylistTitle}
                      onChange={(event) => setNewPlaylistTitle(event.target.value)}
                      placeholder="New playlist name"
                      className="flex-1 rounded-xl bg-white px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleCreatePlaylist}
                      className="rounded-xl bg-primary-blue px-3 py-2 text-sm font-semibold text-white"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isStoryFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-6 rounded-2xl bg-white/80 p-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">Story clip</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="text-xs text-gray-500">
                        Start (sec)
                        <input
                          type="number"
                          min={0}
                          value={startTime}
                          onChange={(event) => setStartTime(Number(event.target.value))}
                          className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-gray-900"
                        />
                      </label>
                      <label className="text-xs text-gray-500">
                        End (sec)
                        <input
                          type="number"
                          min={startTime + 15}
                          value={endTime}
                          onChange={(event) => setEndTime(Number(event.target.value))}
                          className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-sm text-gray-900"
                        />
                      </label>
                    </div>
                    <button
                      onClick={handleCreateStory}
                      disabled={isSubmitting}
                      className="mt-4 w-full rounded-xl bg-primary-blue py-2 text-sm font-semibold text-white disabled:opacity-70"
                    >
                      {isSubmitting ? "Posting..." : "Post to story"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
