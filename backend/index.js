const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const feedRoutes = require('./routes/feed');
const trackRoutes = require('./routes/tracks');
const storyRoutes = require('./routes/stories');
const socialRoutes = require('./routes/social');
const notificationRoutes = require('./routes/notifications');
const playlistRoutes = require('./routes/playlists');
const roomRoutes = require('./routes/rooms');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const prisma = new PrismaClient();
const roomPlayback = new Map();

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent
}));
app.use(cookieParser()); // Parse cookies from requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Vinyl Social API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      feed: '/api/feed',
      tracks: '/api/tracks',
      stories: '/api/stories',
      social: '/api/social',
      notifications: '/api/notifications',
      playlists: '/api/playlists',
      rooms: '/api/rooms',
      uploads: '/api/uploads',
    },
  });
});

async function getRoomQueue(roomId) {
  return prisma.roomQueueItem.findMany({
    where: { roomId },
    include: { track: true },
    orderBy: { position: 'asc' },
  });
}

async function getRoomParticipants(roomId) {
  return prisma.roomParticipant.findMany({
    where: { roomId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

async function broadcastRoomState(roomId) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { hostId: true },
  });
  const queue = await getRoomQueue(roomId);
  const participants = await getRoomParticipants(roomId);
  const playback = roomPlayback.get(roomId) || null;
  io.to(`room:${roomId}`).emit('room:state', {
    queue,
    playback,
    participants,
    hostId: room?.hostId,
  });
}

async function startRoomTrack(roomId, trackId) {
  const startedAt = Date.now();
  const track = await prisma.track.update({
    where: { id: trackId },
    data: { playCount: { increment: 1 } },
  });

  await prisma.room.update({
    where: { id: roomId },
    data: {
      currentTrackId: trackId,
      currentPosition: 0,
    },
  });

  await prisma.roomQueueItem.updateMany({
    where: { roomId },
    data: { isPlaying: false },
  });

  await prisma.roomQueueItem.updateMany({
    where: { roomId, trackId },
    data: { isPlaying: true },
  });

  const existing = roomPlayback.get(roomId);
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId);
  }

  let timeoutId = null;
  if (track?.duration) {
    timeoutId = setTimeout(async () => {
      await advanceRoomQueue(roomId);
    }, track.duration * 1000);
  }

  roomPlayback.set(roomId, {
    trackId,
    startedAt,
    timeoutId,
  });

  io.to(`room:${roomId}`).emit('room:track-start', {
    trackId,
    startedAt,
    track,
  });
}

async function advanceRoomQueue(roomId) {
  const queue = await getRoomQueue(roomId);
  if (queue.length === 0) {
    roomPlayback.delete(roomId);
    io.to(`room:${roomId}`).emit('room:track-stop');
    return;
  }

  const [current, next] = queue;
  if (current) {
    await prisma.roomQueueItem.delete({ where: { id: current.id } });
  }

  if (!next) {
    roomPlayback.delete(roomId);
    io.to(`room:${roomId}`).emit('room:track-stop');
    return;
  }

  await startRoomTrack(roomId, next.trackId);
  await broadcastRoomState(roomId);
}

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user to their personal room
  socket.on('user:join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Story events
  socket.on('story:create', (story) => {
    // Broadcast new story to all connected clients
    io.emit('story:new', story);
    console.log('New story broadcasted:', story.id);
  });

  socket.on('story:delete', (storyId) => {
    // Broadcast story deletion
    io.emit('story:deleted', storyId);
    console.log('Story deletion broadcasted:', storyId);
  });

  // Listen Together room events
  socket.on('room:join', async ({ roomId, userId }) => {
    socket.join(`room:${roomId}`);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    socket.to(`room:${roomId}`).emit('room:user-joined', {
      socketId: socket.id,
      userId,
    });

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { hostId: true },
    });
    const queue = await getRoomQueue(roomId);
    const participants = await getRoomParticipants(roomId);
    const playback = roomPlayback.get(roomId) || null;
    socket.emit('room:state', {
      queue,
      playback,
      participants,
      hostId: room?.hostId,
    });
  });

  socket.on('room:leave', ({ roomId, userId }) => {
    socket.leave(`room:${roomId}`);
    console.log(`Socket ${socket.id} left room ${roomId}`);

    socket.to(`room:${roomId}`).emit('room:user-left', {
      socketId: socket.id,
      userId,
    });
  });

  socket.on('room:track-add', async ({ roomId, trackId, userId }) => {
    try {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      const limit = room?.queueLimit || 20;
      const queueCount = await prisma.roomQueueItem.count({ where: { roomId } });
      const item = await prisma.roomQueueItem.create({
        data: {
          roomId,
          trackId,
          addedBy: userId || null,
          position: queueCount + 1,
        },
        include: { track: true },
      });

      if (queueCount + 1 > limit) {
        const oldest = await prisma.roomQueueItem.findFirst({
          where: { roomId },
          orderBy: { position: 'asc' },
        });
        if (oldest) {
          await prisma.roomQueueItem.delete({ where: { id: oldest.id } });
        }
      }

      io.to(`room:${roomId}`).emit('room:track-added', item);
      await broadcastRoomState(roomId);
    } catch (error) {
      console.error('Error adding track to room:', error);
    }
  });

  socket.on('room:track-play', async ({ roomId, trackId }) => {
    try {
      await startRoomTrack(roomId, trackId);
      await broadcastRoomState(roomId);
    } catch (error) {
      console.error('Error starting track:', error);
    }
  });

  socket.on('room:chat-message', async ({ roomId, userId, message }) => {
    try {
      const chatMessage = await prisma.chatMessage.create({
        data: {
          roomId,
          userId,
          content: message,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      io.to(`room:${roomId}`).emit('room:chat-message', chatMessage);
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║  🎵 Vinyl Social API Server                  ║
║  Port: ${PORT}                                   ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Socket.io: Enabled                          ║
╚═══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
