"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { StoryHeader } from "@/widgets/feed-stories";
import { TopChart } from "@/widgets/feed-top-chart";
import { ForYouFeed } from "@/widgets/feed-for-you";
import { StoryViewer } from "@/widgets/story-viewer";
import { SearchSheet } from "@/features/search-content";
import { usePlayerStore } from "@/features/track-playback";
import { emitStoryDelete, useFeedStore, useRealtime } from "@/shared/lib";
import { toggleLike as apiToggleLike } from "@/features/track-like";
import { getStories, getTopChart, getForYouFeed } from "@/features/feed";
import { deleteStory, markStoryViewed, toggleStoryLike } from "@/entities/story";
import { getCurrentUser, isAuthenticated } from "@/features/auth";
import { Track } from "@/entities/track";
import { Story } from "@/entities/story";

export default function FeedPage() {
  const router = useRouter();
  const { play, currentTrack } = usePlayerStore();
  const {
    stories,
    topChart,
    forYouFeed,
    forYouOffset,
    isLoadingMore,
    setStories,
    setTopChart,
    setForYouFeed,
    appendForYouFeed,
    setForYouOffset,
    setIsLoadingMore,
  } = useFeedStore();

  const [likedTrackIds, setLikedTrackIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useRealtime(currentUserId ?? undefined);

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    getCurrentUser()
      .then((user) => setCurrentUserId(user.id))
      .catch((err) => {
        console.error("Failed to load current user:", err);
      });
  }, []);

  // Load initial data
  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all feed data in parallel
      const [storiesData, topChartData, forYouData] = await Promise.all([
        getStories().catch(() => []),
        getTopChart().catch(() => []),
        getForYouFeed(0, 20).catch(() => []),
      ]);

      setStories(storiesData);
      setTopChart(topChartData);
      setForYouFeed(forYouData);
      setForYouOffset(20);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError("Failed to load feed. Using mock data instead.");

      // Fallback to mock data on error
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock data as fallback
    const mockTracks: Track[] = [
      {
        id: 1,
        title: "Bohemian Rhapsody",
        artist: "Queen",
        fileUrl: "/audio/sample.mp3",
        coverUrl: "https://picsum.photos/seed/track1/300",
        duration: 354,
      },
      {
        id: 2,
        title: "Hotel California",
        artist: "Eagles",
        fileUrl: "/audio/sample.mp3",
        coverUrl: "https://picsum.photos/seed/track2/300",
        duration: 391,
      },
      {
        id: 3,
        title: "Stairway to Heaven",
        artist: "Led Zeppelin",
        fileUrl: "/audio/sample.mp3",
        coverUrl: "https://picsum.photos/seed/track3/300",
        duration: 482,
      },
    ];

    const mockStories: Story[] = [
      {
        id: 1,
        userId: 1,
        trackId: 1,
        startTime: 60,
        endTime: 90,
        createdAt: new Date().toISOString(),
        user: {
          id: 1,
          username: "musiclover",
          avatarUrl: "https://picsum.photos/seed/user1/200",
        },
        track: {
          id: 1,
          title: "Bohemian Rhapsody",
          artist: "Queen",
          coverUrl: "https://picsum.photos/seed/track1/300",
          fileUrl: "/audio/sample.mp3",
        },
        isViewed: false,
      },
    ];

    setStories(mockStories);
    setTopChart(mockTracks);
    setForYouFeed(mockTracks);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const moreTracks = await getForYouFeed(forYouOffset, 20);
      appendForYouFeed(moreTracks);
      setForYouOffset(forYouOffset + 20);
    } catch (err) {
      console.error('Error loading more tracks:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleTrackPlay = (track: Track) => {
    play(track);
  };

  const handleTrackLike = async (trackId: number) => {
    // Optimistic update
    setLikedTrackIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });

    // API call
    try {
      await apiToggleLike(trackId);
    } catch (err) {
      console.error("Error toggling like:", err);
      // Revert on error
      setLikedTrackIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(trackId)) {
          newSet.delete(trackId);
        } else {
          newSet.add(trackId);
        }
        return newSet;
      });
    }
  };

  const handleStoryClick = (story: Story) => {
    setActiveStory(story);
    markStoryViewed(story.id).catch((err) => {
      console.error("Failed to mark story viewed:", err);
    });
    useFeedStore.getState().markStoryViewed(story.id);
  };

  const handleStoryDelete = async (storyId: number) => {
    try {
      await deleteStory(storyId);
      emitStoryDelete(storyId);
      useFeedStore.getState().removeStory(storyId);
      setActiveStory(null);
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
  };

  const handleStoryLike = async (storyId: number) => {
    try {
      await toggleStoryLike(storyId);
    } catch (err) {
      console.error("Failed to like story:", err);
    }
  };

  const handleOpenTrack = (trackId: number) => {
    router.push(`/track/${trackId}`);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>) => {
    setTouchStartY(event.touches[0]?.clientY ?? null);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLButtonElement>) => {
    if (touchStartY === null) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    if (touchStartY - currentY > 60) {
      setIsSearchOpen(true);
      setTouchStartY(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-w-screen w-screen h-full flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-screen w-screen h-full flex flex-col bg-cream">
      {/* Error Banner */}
      {error && (
        <div className="bg-terracotta/20 border-l-4 border-terracotta px-4 py-2 text-sm text-gray-800">
          {error}
        </div>
      )}

      {/* Story Header */}
      <StoryHeader stories={stories} onStoryClick={handleStoryClick} />

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Vinyl Social
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">Feed</h1>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-11 h-11 rounded-full bg-white/70 flex items-center justify-center text-primary-blue shadow-sm"
            aria-label="Open search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Top Chart */}
        <TopChart
          tracks={topChart}
          currentlyPlayingId={currentTrack?.id}
          onTrackClick={handleTrackPlay}
        />

        {/* For You Feed */}
        <ForYouFeed
          tracks={forYouFeed}
          currentlyPlayingId={currentTrack?.id}
          onTrackPlay={handleTrackPlay}
          onTrackLike={handleTrackLike}
          likedTrackIds={likedTrackIds}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          onTrackOpen={handleOpenTrack}
        />
      </div>

      <button
        onClick={() => setIsSearchOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-gray-700 shadow-md"
      >
        <Sparkles className="w-4 h-4 text-primary-blue" />
        Pull up to search
      </button>

      <SearchSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onTrackPlay={handleTrackPlay}
      />

      <StoryViewer
        story={activeStory}
        isOpen={!!activeStory}
        isOwner={activeStory?.userId === currentUserId}
        onClose={() => setActiveStory(null)}
        onDelete={handleStoryDelete}
        onLike={handleStoryLike}
      />
    </div>
  );
}
