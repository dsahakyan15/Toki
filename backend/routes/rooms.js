const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/rooms
 * Create or get the host's room
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const name = String(req.body.name || '').trim();

    const existing = await prisma.room.findUnique({
      where: { hostId: userId },
    });

    if (existing) {
      return res.json(existing);
    }

    const room = await prisma.room.create({
      data: {
        hostId: userId,
        name: name || null,
        isActive: true,
      },
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

/**
 * GET /api/rooms/:id
 * Get room state (participants + queue)
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const roomId = Number.parseInt(req.params.id, 10);

    if (!roomId) {
      return res.status(400).json({ error: 'Invalid room id' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        queue: {
          include: {
            track: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

/**
 * POST /api/rooms/:id/join
 * Join a room
 */
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const roomId = Number.parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (!roomId) {
      return res.status(400).json({ error: 'Invalid room id' });
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: { userId },
    });

    if (existingParticipant) {
      if (existingParticipant.roomId === roomId) {
        return res.json(existingParticipant);
      }

      await prisma.roomParticipant.delete({ where: { id: existingParticipant.id } });
    }

    const participant = await prisma.roomParticipant.create({
      data: {
        roomId,
        userId,
        canControlQueue: room.hostId === userId,
      },
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

/**
 * POST /api/rooms/:id/leave
 * Leave a room
 */
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const participant = await prisma.roomParticipant.findUnique({
      where: { userId },
    });

    if (!participant) {
      return res.json({ message: 'Not in a room' });
    }

    await prisma.roomParticipant.delete({ where: { id: participant.id } });
    res.json({ message: 'Left room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

/**
 * POST /api/rooms/:id/queue
 * Add a track to room queue (FIFO)
 */
router.post('/:id/queue', authenticateToken, async (req, res) => {
  try {
    const roomId = Number.parseInt(req.params.id, 10);
    const trackId = Number.parseInt(req.body.trackId, 10);
    const userId = req.user.id;

    if (!roomId || !trackId) {
      return res.status(400).json({ error: 'roomId and trackId are required' });
    }

    const participant = await prisma.roomParticipant.findUnique({
      where: { userId },
      include: { room: true },
    });

    if (!participant || participant.roomId !== roomId) {
      return res.status(403).json({ error: 'Not a room participant' });
    }

    const isHost = participant.room.hostId === userId;
    if (!isHost && !participant.canControlQueue) {
      return res.status(403).json({ error: 'No permission to control queue' });
    }

    const queueCount = await prisma.roomQueueItem.count({
      where: { roomId },
    });

    const nextPosition = queueCount + 1;

    const item = await prisma.roomQueueItem.create({
      data: {
        roomId,
        trackId,
        addedBy: userId,
        position: nextPosition,
      },
      include: { track: true },
    });

    const limit = participant.room.queueLimit || 20;
    if (queueCount + 1 > limit) {
      const oldest = await prisma.roomQueueItem.findFirst({
        where: { roomId },
        orderBy: { position: 'asc' },
      });
      if (oldest) {
        await prisma.roomQueueItem.delete({ where: { id: oldest.id } });
      }
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: 'Failed to add track to queue' });
  }
});

/**
 * POST /api/rooms/:id/permissions
 * Update queue control permissions (host only)
 */
router.post('/:id/permissions', authenticateToken, async (req, res) => {
  try {
    const roomId = Number.parseInt(req.params.id, 10);
    const targetUserId = Number.parseInt(req.body.userId, 10);
    const canControlQueue = Boolean(req.body.canControlQueue);
    const userId = req.user.id;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId !== userId) {
      return res.status(403).json({ error: 'Only host can update permissions' });
    }

    const participant = await prisma.roomParticipant.findFirst({
      where: { roomId, userId: targetUserId },
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const updated = await prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { canControlQueue },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

module.exports = router;
