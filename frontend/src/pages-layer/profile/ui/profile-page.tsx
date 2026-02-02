"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Lock, UserPlus, X } from "lucide-react";
import { getCurrentUser, isAuthenticated } from "@/features/auth";
import { acceptFriendRequest, getFriendRequests, sendFriendRequest } from "@/features/friend-request";
import { getUserFriends, getUserLikes, getUserPlaylists, getUserProfile } from "@/entities/user";
import { Track, VinylRecord } from "@/entities/track";
import { getNotifications, NotificationItem } from "@/entities/notification";
import { slideUp } from "@/shared/lib";

interface ProfileStats {
  likedTracksCount: number;
  playlistsCount: number;
  friendsCount: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    id: number;
    username: string | null;
    avatarUrl?: string;
    isPrivate: boolean;
    relationship: string;
    canViewFull: boolean;
    stats: ProfileStats | null | undefined;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"likes" | "playlists" | "friends">("likes");
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Array<{ id: number; title: string; _count?: { items: number } }>>([]);
  const [friends, setFriends] = useState<Array<{ id: number; username: string | null; avatarUrl?: string }>>([]);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [friendRequests, setFriendRequests] = useState<
    Array<{ id: number; requester: { id: number; username: string | null; avatarUrl?: string } }>
  >([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        const profileData = await getUserProfile(currentUser.id);
        setProfile(profileData);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile || !profile.canViewFull) return;

    const loadTab = async () => {
      try {
        setIsLoadingTab(true);
        if (activeTab === "likes") {
          const results = await getUserLikes(profile.id);
          setLikedTracks(results.map((item) => item.track));
        }
        if (activeTab === "playlists") {
          const results = await getUserPlaylists(profile.id);
          setPlaylists(results);
        }
        if (activeTab === "friends") {
          const results = await getUserFriends(profile.id);
          setFriends(results);
        }
      } catch (error) {
        console.error("Failed to load profile tab:", error);
      } finally {
        setIsLoadingTab(false);
      }
    };

    loadTab();
  }, [activeTab, profile]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const loadNotifications = async () => {
      try {
        const [notificationsData, requestsData] = await Promise.all([
          getNotifications(20),
          getFriendRequests(),
        ]);
        setNotifications(notificationsData);
        setFriendRequests(requestsData);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadNotifications();
  }, [isNotificationsOpen]);

  const handleAcceptRequest = async (requesterId: number, requestId: number) => {
    try {
      await acceptFriendRequest(requesterId);
      setFriendRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error("Failed to accept friend request:", error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;
    try {
      await sendFriendRequest(profile.id);
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-w-screen w-screen h-full flex items-center justify-center bg-mint/10">
        <div className="text-center text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-w-screen w-screen h-full flex items-center justify-center bg-mint/10 px-6 text-center">
        <div>
          <div className="w-20 h-20 rounded-full bg-primary-blue/20 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">You are not signed in</h1>
          <p className="text-sm text-gray-600 mt-2">
            Create an account to start sharing vinyl stories.
          </p>
        </div>
      </div>
    );
  }

  const isLocked = profile.isPrivate && !profile.canViewFull;

  return (
    <div className="min-w-screen w-screen h-full flex flex-col bg-mint/10">
      <header className="relative px-6 pt-10 pb-6 text-center">
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="absolute right-6 top-8 w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-primary-blue"
        >
          <Bell className="w-5 h-5" />
        </button>
        <div className="mx-auto w-28 h-28 flex items-center justify-center">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.username || "User"}
              className="w-28 h-28 rounded-full object-cover"
            />
          ) : (
            <VinylRecord size="large" hasNewContent={false} />
          )}
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          {profile.username || "Vinyl Listener"}
        </h1>
        {profile.isPrivate && (
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gray-500">Private</p>
        )}
      </header>

      {isLocked ? (
        <div className="flex-1 px-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary-blue" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">This profile is private</h2>
          <p className="text-sm text-gray-600 mt-2">
            Send a friend request to see their vinyl activity.
          </p>
          <button
            onClick={handleSendFriendRequest}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-blue px-5 py-2 text-sm font-semibold text-white"
          >
            <UserPlus className="w-4 h-4" />
            Add friend
          </button>
        </div>
      ) : (
        <div className="flex-1 px-6 pb-10">
          <div className="grid grid-cols-3 gap-3 rounded-3xl bg-white/70 p-4 text-center">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {profile.stats?.likedTracksCount ?? 0}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Likes</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {profile.stats?.playlistsCount ?? 0}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Playlists</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {profile.stats?.friendsCount ?? 0}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Friends</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white/70 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-500">
              <button
                onClick={() => setActiveTab("likes")}
                className={activeTab === "likes" ? "text-primary-blue font-semibold" : ""}
              >
                Likes
              </button>
              <button
                onClick={() => setActiveTab("playlists")}
                className={activeTab === "playlists" ? "text-primary-blue font-semibold" : ""}
              >
                Playlists
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={activeTab === "friends" ? "text-primary-blue font-semibold" : ""}
              >
                Friends
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              {isLoadingTab && <p className="text-xs text-gray-500">Loading...</p>}

              {!isLoadingTab && activeTab === "likes" && (
                <>
                  {likedTracks.length === 0 ? (
                    <p className="text-xs text-gray-500">No liked tracks yet.</p>
                  ) : (
                    likedTracks.map((track) => (
                      <div key={track.id} className="flex items-center justify-between">
                        <span className="truncate">{track.title}</span>
                        <span className="text-xs text-gray-400">{track.artist}</span>
                      </div>
                    ))
                  )}
                </>
              )}

              {!isLoadingTab && activeTab === "playlists" && (
                <>
                  {playlists.length === 0 ? (
                    <p className="text-xs text-gray-500">No playlists yet.</p>
                  ) : (
                    playlists.map((playlist) => (
                      <div key={playlist.id} className="flex items-center justify-between">
                        <span>{playlist.title}</span>
                        <span className="text-xs text-gray-400">
                          {playlist._count?.items ?? 0} tracks
                        </span>
                      </div>
                    ))
                  )}
                </>
              )}

              {!isLoadingTab && activeTab === "friends" && (
                <>
                  {friends.length === 0 ? (
                    <p className="text-xs text-gray-500">No friends yet.</p>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-blue/20 overflow-hidden">
                          {friend.avatarUrl && (
                            <img
                              src={friend.avatarUrl}
                              alt={friend.username || "User"}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span>{friend.username || "User"}</span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isNotificationsOpen && (
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
              className="w-full bg-cream rounded-t-3xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">Notifications</h4>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {friendRequests.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Friend Requests
                  </p>
                  <div className="space-y-2">
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2"
                      >
                        <span className="text-sm text-gray-800">
                          {request.requester.username || "User"}
                        </span>
                        <button
                          onClick={() => handleAcceptRequest(request.requester.id, request.id)}
                          className="rounded-full bg-primary-blue px-3 py-1 text-xs font-semibold text-white"
                        >
                          Accept
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No notifications yet.</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-2xl bg-white/80 px-3 py-2 text-sm text-gray-700"
                    >
                      <p className="font-semibold text-gray-900">{notification.title}</p>
                      {notification.message && (
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
