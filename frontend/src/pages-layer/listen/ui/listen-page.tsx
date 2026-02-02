"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Plus, Users, X } from "lucide-react";
import { getSocket, slideUp, useRealtime } from "@/shared/lib";
import { SearchSheet } from "@/features/search-content";
import { createRoom, getRoom, joinRoom, updateQueuePermission } from "@/entities/room";
import { getCurrentUser, isAuthenticated } from "@/features/auth";
import { Track } from "@/entities/track";

interface PlaybackState {
  trackId: number;
  startedAt: number;
}

interface RoomQueueItem {
  id: number;
  track: Track;
  isPlaying: boolean;
  position: number;
}

interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string | null;
    avatarUrl?: string;
  };
}

export default function ListenTogetherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");
  const initialRoomId = roomParam ? Number.parseInt(roomParam, 10) : null;

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<number | null>(initialRoomId);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [queue, setQueue] = useState<RoomQueueItem[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [participants, setParticipants] = useState<
    Array<{
      id: number;
      user: { id: number; username: string | null; avatarUrl?: string };
      canControlQueue?: boolean;
    }>
  >([]);
  const [hostId, setHostId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<RoomQueueItem[]>([]);

  useRealtime(currentUserId ?? undefined);

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    getCurrentUser()
      .then((user) => setCurrentUserId(user.id))
      .catch((error) => console.error("Failed to load user:", error));
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const setupRoom = async () => {
      try {
        if (!roomId) {
          const room = await createRoom("Infinity Room");
          setRoomId(room.id);
          setRoomName(room.name || "Infinity Room");
          setQueue([]);
          setParticipants([]);
          setHostId(room.hostId ?? null);
          router.replace(`/listen-together?room=${room.id}`);
        } else {
          const room = await getRoom(roomId);
          setRoomName(room.name || "Infinity Room");
          setQueue(room.queue as RoomQueueItem[]);
          setParticipants((room.participants as typeof participants) || []);
          setHostId(room.hostId ?? null);
          const playing = room.queue?.find((item: RoomQueueItem) => item.isPlaying);
          if (playing) {
            setCurrentTrack(playing.track);
          }
          await joinRoom(roomId);
        }
      } catch (error) {
        console.error("Failed to setup room:", error);
      }
    };

    setupRoom();
  }, [currentUserId, roomId, router]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId || !currentUserId) return;

    socket.emit("room:join", { roomId, userId: currentUserId });

    const handleState = (state: {
      queue: RoomQueueItem[];
      playback?: PlaybackState | null;
      participants?: typeof participants;
      hostId?: number;
    }) => {
      setQueue(state.queue || []);
      if (state.participants) {
        setParticipants(state.participants);
      }
      if (state.hostId) {
        setHostId(state.hostId);
      }
      if (state.playback) {
        setPlayback(state.playback);
        const trackFromQueue = state.queue?.find(
          (item) => item.track.id === state.playback?.trackId
        )?.track;
        if (trackFromQueue) {
          setCurrentTrack(trackFromQueue);
          startPlayback(trackFromQueue, state.playback.startedAt);
        }
      }
    };

    const handleTrackStart = (payload: {
      trackId: number;
      startedAt: number;
      track?: Track;
    }) => {
      const resolvedTrack =
        payload.track ||
        queueRef.current.find((item) => item.track.id === payload.trackId)?.track;
      if (resolvedTrack) {
        setCurrentTrack(resolvedTrack);
        setPlayback({ trackId: payload.trackId, startedAt: payload.startedAt });
        startPlayback(resolvedTrack, payload.startedAt);
      }
    };

    const handleTrackStop = () => {
      stopPlayback();
      setPlayback(null);
      setCurrentTrack(null);
    };

    const handleQueueUpdate = (item: RoomQueueItem) => {
      setQueue((prev) => [...prev, item]);
    };

    const handleChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("room:state", handleState);
    socket.on("room:track-start", handleTrackStart);
    socket.on("room:track-stop", handleTrackStop);
    socket.on("room:track-added", handleQueueUpdate);
    socket.on("room:chat-message", handleChatMessage);

    return () => {
      socket.emit("room:leave", { roomId, userId: currentUserId });
      socket.off("room:state", handleState);
      socket.off("room:track-start", handleTrackStart);
      socket.off("room:track-stop", handleTrackStop);
      socket.off("room:track-added", handleQueueUpdate);
      socket.off("room:chat-message", handleChatMessage);
    };
  }, [roomId, currentUserId]);

  useEffect(() => {
    if (!audioRef.current) return undefined;
    const interval = window.setInterval(() => {
      if (audioRef.current && audioRef.current.duration) {
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [currentTrack]);

  const startPlayback = (track: Track, startedAt: number) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(track.fileUrl);
    } else if (audioRef.current.src !== track.fileUrl) {
      audioRef.current.pause();
      audioRef.current.src = track.fileUrl;
    }

    const offset = Math.max(0, (Date.now() - startedAt) / 1000);
    audioRef.current.currentTime = offset;
    audioRef.current.play().catch((error) => {
      console.error("Failed to play room audio:", error);
    });
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handlePlayTrack = (trackId: number) => {
    const socket = getSocket();
    if (!socket || !roomId) return;
    socket.emit("room:track-play", { roomId, trackId });
  };

  const handleAddTrack = (track: Track) => {
    const socket = getSocket();
    if (!socket || !roomId) return;
    socket.emit("room:track-add", { roomId, trackId: track.id, userId: currentUserId });
    setIsSearchOpen(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const socket = getSocket();
    if (!socket || !roomId || !currentUserId) return;

    socket.emit("room:chat-message", {
      roomId,
      userId: currentUserId,
      message: newMessage.trim(),
    });
    setNewMessage("");
  };

  const handleTogglePermission = async (participantId: number, canControlQueue: boolean) => {
    if (!roomId) return;
    try {
      await updateQueuePermission(roomId, participantId, canControlQueue);
      setParticipants((prev) =>
        prev.map((participant) =>
          participant.user.id === participantId
            ? { ...participant, canControlQueue }
            : participant
        )
      );
    } catch (error) {
      console.error("Failed to update permission:", error);
    }
  };

  const nowPlaying = useMemo(() => {
    if (currentTrack) return currentTrack;
    return queue.find((item) => item.isPlaying)?.track || null;
  }, [currentTrack, queue]);

  return (
    <div className="min-w-screen w-screen h-full flex flex-col bg-lavender/15 relative">
      <header className="flex items-center justify-between px-4 pt-6 pb-4">
        <button
          onClick={() => setIsParticipantsOpen(true)}
          className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-primary-blue"
        >
          <Users className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-primary-blue">∞</span>
          <span className="text-xs uppercase tracking-[0.3em] text-gray-500">
            {roomName || "Infinity Room"}
          </span>
        </div>
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center text-primary-blue"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 px-4 overflow-y-auto">
        <div className="rounded-3xl bg-white/70 p-4 shadow-sm">
          <h2 className="text-sm uppercase tracking-[0.25em] text-gray-500">Now Playing</h2>
          <p className="text-xl font-semibold text-gray-900 mt-2">
            {nowPlaying?.title || "No track playing"}
          </p>
          <p className="text-sm text-gray-600">{nowPlaying?.artist || ""}</p>
          <div className="mt-4 h-2 rounded-full bg-primary-blue/20">
            <div className="h-2 rounded-full bg-primary-blue" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase tracking-[0.2em] text-gray-500">Queue</h3>
            <span className="text-xs text-gray-500">{queue.length}/20</span>
          </div>
          <div className="space-y-2">
            {queue.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handlePlayTrack(item.track.id)}
                className={`w-full flex items-center justify-between rounded-2xl px-3 py-2 text-left transition ${
                  item.track.id === nowPlaying?.id
                    ? "bg-primary-blue text-white"
                    : "bg-white/70 text-gray-800"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{item.track.title}</p>
                  <p className={`text-xs ${item.track.id === nowPlaying?.id ? "text-white/70" : "text-gray-500"}`}>
                    {item.track.artist}
                  </p>
                </div>
                {item.track.id === nowPlaying?.id && (
                  <span className="text-xs uppercase tracking-[0.2em]">Playing</span>
                )}
                {item.track.id !== nowPlaying?.id && index === 0 && (
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-400">Up next</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsChatOpen(true)}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center shadow-lg"
        aria-label="Open chat"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      <SearchSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onTrackSelect={handleAddTrack}
        trackActionLabel="Add"
      />

      <AnimatePresence>
        {isParticipantsOpen && (
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
                <h4 className="text-lg font-semibold text-gray-900">Participants</h4>
                <button
                  onClick={() => setIsParticipantsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"
                  aria-label="Close participants"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {participants.length === 0 ? (
                  <p className="text-sm text-gray-500">No one here yet.</p>
                ) : (
                  participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-blue/20 overflow-hidden">
                        {participant.user.avatarUrl && (
                          <img
                            src={participant.user.avatarUrl}
                            alt={participant.user.username || "User"}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="text-sm text-gray-800">
                        {participant.user.username || "User"}
                      </span>
                      {hostId === currentUserId && participant.user.id !== currentUserId && (
                        <button
                          onClick={() =>
                            handleTogglePermission(
                              participant.user.id,
                              !participant.canControlQueue
                            )
                          }
                          className="ml-auto rounded-full bg-primary-blue/10 px-3 py-1 text-xs text-primary-blue"
                        >
                          {participant.canControlQueue ? "Restrict" : "Allow"} queue
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {isChatOpen && (
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
                <h4 className="text-lg font-semibold text-gray-900">Room Chat</h4>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className="rounded-2xl bg-white/80 px-3 py-2 text-sm text-gray-700">
                    <span className="font-semibold text-primary-blue mr-2">
                      {msg.user?.username || "user"}
                    </span>
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  className="flex-1 rounded-full bg-white/80 px-4 py-2 text-sm outline-none"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                />
                <button
                  onClick={handleSendMessage}
                  className="rounded-full bg-primary-blue px-4 py-2 text-sm font-semibold text-white"
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
