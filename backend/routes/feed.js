const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

async function getFriendIds(userId) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  });

  return friendships.map((friendship) =>
    friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId
  );
}

/**
 * GET /api/feed/stories
 * Get stories from friends (last 24 hours)
 * If not authenticated, returns an empty feed
 */
router.get('/stories', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (!userId) {
      return res.json([]);
    }

    const friendIds = await getFriendIds(userId);
    if (friendIds.length === 0) {
      return res.json([]);
    }

    // If authenticated, return stories from friends only
    const stories = await prisma.story.findMany({
      where: {
        createdAt: { gte: yesterday },
        userId: { in: friendIds },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        track: {
          select: {
            id: true,
            title: true,
            artist: true,
            coverUrl: true,
            fileUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

/**
 * GET /api/feed/top-chart
 * Get top 10 most played tracks
 */
router.get('/top-chart', async (req, res) => {
  try {
    // Get tracks with most plays
    const topTracks = await prisma.track.findMany({
      include: {
        _count: {
          select: { likes: true },
        },
      },
      orderBy: {
        playCount: 'desc',
      },
      take: 10,
    });

    // Format response
    const formattedTracks = topTracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      fileUrl: track.fileUrl,
      coverUrl: track.coverUrl,
      duration: track.duration,
      playCount: track.playCount,
      likesCount: track._count.likes,
    }));

    res.json(formattedTracks);
  } catch (error) {
    console.error('Error fetching top chart:', error);
    res.status(500).json({ error: 'Failed to fetch top chart' });
  }
});

/**
 * GET /api/feed/for-you
 * Get personalized feed based on user likes
 * Query params: offset, limit
 * If not authenticated, returns popular tracks
 */
router.get('/for-you', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;

    // If not authenticated, return public generic feed (popular tracks)
    if (!userId) {
      const popularTracks = await prisma.track.findMany({
        include: {
          _count: {
            select: { likes: true },
          },
        },
        orderBy: {
          likes: {
            _count: 'desc',
          },
        },
        skip: offset,
        take: limit,
      });

      return res.json(popularTracks);
    }

    const friendIds = await getFriendIds(userId);
    if (friendIds.length === 0) {
      return res.json([]);
    }

    // Authenticated feed: tracks only from friends
    const friendTracks = await prisma.track.findMany({
      where: {
        OR: [
          { uploaderId: { in: friendIds } },
          {
            likes: {
              some: {
                userId: { in: friendIds },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: { likes: true },
        },
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      skip: offset,
      take: limit,
    });

    res.json(friendTracks);
  } catch (error) {
    console.error('Error fetching for you feed:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
