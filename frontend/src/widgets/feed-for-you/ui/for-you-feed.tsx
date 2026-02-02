"use client";

import { Track, TrackCard } from "@/entities/track";
import { useEffect, useRef } from "react";

interface ForYouFeedProps {
  tracks: Track[];
  currentlyPlayingId?: number;
  onTrackPlay: (track: Track) => void;
  onTrackLike: (trackId: number) => void;
  likedTrackIds: Set<number>;
  onTrackOpen?: (trackId: number) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function ForYouFeed({
  tracks,
  currentlyPlayingId,
  onTrackPlay,
  onTrackLike,
  likedTrackIds,
  onTrackOpen,
  onLoadMore,
  isLoadingMore = false,
}: ForYouFeedProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.8 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [onLoadMore, isLoadingMore]);

  if (tracks.length === 0 && !isLoadingMore) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No recommendations yet</p>
        <p className="text-sm mt-2">Like some tracks to get personalized recommendations</p>
      </div>
    );
  }

  return (
    <section className="pb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 px-4">For You</h2>
      <div className="space-y-3 px-4">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            isPlaying={track.id === currentlyPlayingId}
            onPlay={() => onTrackPlay(track)}
            onLike={() => onTrackLike(track.id)}
            isLiked={likedTrackIds.has(track.id)}
            onOpen={onTrackOpen ? () => onTrackOpen(track.id) : undefined}
          />
        ))}

        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="text-center py-4">
            <div className="inline-block w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Intersection observer trigger */}
        <div ref={observerRef} className="h-4" />
      </div>
    </section>
  );
}
