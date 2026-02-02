const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/playlists
 * Get current user's playlists
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const playlists = await prisma.playlist.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

/**
 * POST /api/playlists
 * Create a new playlist
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const title = String(req.body.title || '').trim();

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        title,
        creatorId: userId,
      },
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

/**
 * GET /api/playlists/:id
 * Get playlist details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = Number.parseInt(req.params.id, 10);

    if (!playlistId) {
      return res.status(400).json({ error: 'Invalid playlist id' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        items: {
          include: {
            track: true,
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!playlist || playlist.creatorId !== userId) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

/**
 * POST /api/playlists/:id/items
 * Add a track to playlist
 */
router.post('/:id/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = Number.parseInt(req.params.id, 10);
    const trackId = Number.parseInt(req.body.trackId, 10);

    if (!playlistId || !trackId) {
      return res.status(400).json({ error: 'playlistId and trackId are required' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist || playlist.creatorId !== userId) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const item = await prisma.playlistItem.create({
      data: {
        playlistId,
        trackId,
      },
      include: { track: true },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    res.status(500).json({ error: 'Failed to add track to playlist' });
  }
});

/**
 * DELETE /api/playlists/:id/items/:itemId
 * Remove a track from playlist
 */
router.delete('/:id/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistId = Number.parseInt(req.params.id, 10);
    const itemId = Number.parseInt(req.params.itemId, 10);

    if (!playlistId || !itemId) {
      return res.status(400).json({ error: 'Invalid playlist item' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist || playlist.creatorId !== userId) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    await prisma.playlistItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Track removed from playlist' });
  } catch (error) {
    console.error('Error removing playlist item:', error);
    res.status(500).json({ error: 'Failed to remove playlist item' });
  }
});

module.exports = router;
