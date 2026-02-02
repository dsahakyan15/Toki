"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Music2, Users, UserPlus, Clock } from "lucide-react";
import { useNavigationStore } from "@/features/swipe-navigation";
import { searchTracks, searchUsers } from "@/features/search-content";
import { sendFriendRequest } from "@/features/friend-request";
import { Track } from "@/entities/track";
import { UserSearchResult } from "@/entities/user";
import { usePlayerStore } from "@/features/track-playback";

const TABS = [
  { key: "music" as const, label: "Music", icon: Music2 },
  { key: "users" as const, label: "Users", icon: Users },
];

type TabKey = (typeof TABS)[number]["key"];

export function SearchBar() {
  const { isSearchOpen, toggleSearch } = useNavigationStore();
  const { play } = usePlayerStore();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("music");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmedQuery = query.trim();

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-focus input when search opens on mobile
  useEffect(() => {
    if (isMobile && isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMobile, isSearchOpen]);

  // Reset on close
  useEffect(() => {
    if (!isSearchOpen && isMobile) {
      setQuery("");
      setTracks([]);
      setUsers([]);
      setIsLoading(false);
    }
  }, [isSearchOpen, isMobile]);

  // Search with debounce
  useEffect(() => {
    if (!trimmedQuery) {
      setTracks([]);
      setUsers([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        if (activeTab === "music") {
          const results = await searchTracks(trimmedQuery, 20);
          setTracks(results);
        } else {
          const results = await searchUsers(trimmedQuery, 20);
          setUsers(results);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [activeTab, trimmedQuery]);

  const emptyMessage = useMemo(() => {
    if (!trimmedQuery) return "Start typing to search";
    if (isLoading) return "Searching...";
    return "No results found";
  }, [isLoading, trimmedQuery]);

  const handleRequest = async (userId: number) => {
    try {
      await sendFriendRequest(userId);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, friendshipStatus: "pending" } : user
        )
      );
    } catch (error) {
      console.error("Failed to send request:", error);
    }
  };

  const handleTrackPlay = (track: Track) => {
    play(track);
    if (isMobile) {
      toggleSearch();
    }
  };

  const handleClose = () => {
    if (isMobile) {
      toggleSearch();
    }
    setQuery("");
  };

  // Desktop: Always visible
  if (!isMobile) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-[600px] px-4">
        <div className="relative bg-white/70 backdrop-blur-md rounded-full border border-white/50 shadow-lg">
          <div className="flex items-center gap-2 px-6 py-4">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tracks or users"
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
            />
            {query && (
              <button
                onClick={handleClose}
                className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {trimmedQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-cream rounded-3xl shadow-2xl border border-white/50 max-h-[60vh] overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-2 p-4 border-b border-white/50">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                        isActive
                          ? "bg-primary-blue text-white"
                          : "bg-white/70 text-gray-600 hover:bg-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Results */}
              <div className="overflow-y-auto max-h-[50vh] p-4">
                {activeTab === "music" ? (
                  tracks.length > 0 ? (
                    <div className="space-y-2">
                      {tracks.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => handleTrackPlay(track)}
                          className="w-full flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 text-left hover:bg-white transition"
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
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-10">
                      {emptyMessage}
                    </p>
                  )
                ) : users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-primary-blue/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.username || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-primary-blue" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.username || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.isPrivate ? "Private" : "Public"}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {user.friendshipStatus === "friends" ? (
                            <span className="text-xs font-semibold text-primary-blue">
                              Friends
                            </span>
                          ) : user.friendshipStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequest(user.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-primary-blue/10 px-3 py-1.5 text-xs font-semibold text-primary-blue hover:bg-primary-blue/20"
                            >
                              <UserPlus className="w-3 h-3" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-10">
                    {emptyMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile: Slide down from top
  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-md rounded-b-2xl border-b border-white/50 shadow-lg"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="p-4">
            {/* Search input */}
            <div className="relative flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tracks or users"
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-sm"
              />
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-gray-600 flex-shrink-0"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            {trimmedQuery && (
              <div className="flex items-center gap-2 mb-3">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.key === activeTab;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        isActive
                          ? "bg-primary-blue text-white"
                          : "bg-white/70 text-gray-600"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Results */}
            {trimmedQuery && (
              <div className="max-h-[60vh] overflow-y-auto">
                {activeTab === "music" ? (
                  tracks.length > 0 ? (
                    <div className="space-y-2">
                      {tracks.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => handleTrackPlay(track)}
                          className="w-full flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary-blue/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {track.coverUrl ? (
                              <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music2 className="w-4 h-4 text-primary-blue" />
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
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">
                      {emptyMessage}
                    </p>
                  )
                ) : users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary-blue/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.username || "User"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-4 h-4 text-primary-blue" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.username || "User"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.isPrivate ? "Private" : "Public"}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {user.friendshipStatus === "friends" ? (
                            <span className="text-xs font-semibold text-primary-blue">
                              Friends
                            </span>
                          ) : user.friendshipStatus === "pending" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRequest(user.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-primary-blue/10 px-2 py-1 text-xs font-semibold text-primary-blue"
                            >
                              <UserPlus className="w-3 h-3" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">
                    {emptyMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
