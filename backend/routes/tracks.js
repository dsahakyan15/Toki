const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/tracks/search
 * Search for tracks by title or artist
 * IMPORTANT: This route MUST be defined BEFORE /:id route
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;

    const tracks = await prisma.track.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { likes: true },
        },
      },
      take: limit,
    });

    res.json(tracks);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

/**
 * GET /api/tracks/:id
 * Get track details by ID
 * IMPORTANT: This route must be AFTER /search to avoid treating "search" as an ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);

    // Validate that id is a number
    if (isNaN(trackId)) {
      return res.status(400).json({ error: 'Invalid track ID' });
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        _count: {
          select: { likes: true },
        },
        uploader: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Check if current user liked this track
    let isLiked = false;
    if (req.user) {
      const like = await prisma.like.findUnique({
        where: {
          userId_trackId: {
            userId: req.user.id,
            trackId: trackId,
          },
        },
      });
      isLiked = !!like;
    }

    res.json({
      ...track,
      likesCount: track._count.likes,
      playCount: track.playCount,
      isLiked,
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

/**
 * POST /api/tracks/:id/like
 * Toggle like status for a track
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const trackId = parseInt(req.params.id);

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          userId_trackId: {
            userId,
            trackId,
          },
        },
      });

      res.json({ liked: false, message: 'Track unliked' });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          trackId,
        },
      });

      res.json({ liked: true, message: 'Track liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

/**
 * POST /api/tracks
 * Create a new track (self-hosted upload)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, artist, fileUrl, coverUrl, duration } = req.body;

    if (!title || !artist || !fileUrl) {
      return res.status(400).json({ error: 'title, artist, and fileUrl are required' });
    }

    const track = await prisma.track.create({
      data: {
        title,
        artist,
        fileUrl,
        coverUrl: coverUrl || null,
        duration: duration ? Number.parseInt(duration, 10) : null,
        uploaderId: userId,
      },
    });

    res.status(201).json(track);
  } catch (error) {
    console.error('Error creating track:', error);
    res.status(500).json({ error: 'Failed to create track' });
  }
});

/**
 * POST /api/tracks/:id/play
 * Increment play count
 */
router.post('/:id/play', async (req, res) => {
  try {
    const trackId = parseInt(req.params.id);

    if (isNaN(trackId)) {
      return res.status(400).json({ error: 'Invalid track ID' });
    }

    const updated = await prisma.track.update({
      where: { id: trackId },
      data: {
        playCount: { increment: 1 },
      },
      select: {
        id: true,
        playCount: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error incrementing play count:', error);
    res.status(500).json({ error: 'Failed to update play count' });
  }
});

module.exports = router;
