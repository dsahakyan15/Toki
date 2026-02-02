const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/stories
 * Create a new story
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { trackId, startTime, endTime } = req.body;

    // Validate input
    if (!trackId || startTime === undefined || endTime === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: trackId, startTime, endTime',
      });
    }

    // Validate duration (15-30 seconds)
    const duration = endTime - startTime;
    if (duration < 15 || duration > 30) {
      return res.status(400).json({
        error: 'Story duration must be between 15 and 30 seconds',
      });
    }

    // Check if track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Create story
    const story = await prisma.story.create({
      data: {
        userId,
        trackId,
        startTime,
        endTime,
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
    });

    res.status(201).json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

/**
 * DELETE /api/stories/:id
 * Delete user's own story
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = parseInt(req.params.id);

    // Check if story exists and belongs to user
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own stories' });
    }

    // Delete story
    await prisma.story.delete({
      where: { id: storyId },
    });

    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

/**
 * POST /api/stories/:id/view
 * Mark story as viewed (for analytics/notifications)
 * Note: In MVP, this is optional - can be implemented in-memory or ignored
 */
router.post('/:id/view', authenticateToken, async (req, res) => {
  try {
    const storyId = parseInt(req.params.id);
    const userId = req.user.id;

    // For MVP, we just return success
    // In production, you might want to track views in a separate table
    res.json({ message: 'Story view recorded', storyId, userId });
  } catch (error) {
    console.error('Error recording story view:', error);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

/**
 * POST /api/stories/:id/like
 * Toggle like status for a story
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const storyId = parseInt(req.params.id);

    if (isNaN(storyId)) {
      return res.status(400).json({ error: 'Invalid story ID' });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const existingLike = await prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existingLike) {
      await prisma.storyLike.delete({
        where: {
          storyId_userId: {
            storyId,
            userId,
          },
        },
      });

      return res.json({ liked: false, message: 'Story unliked' });
    }

    await prisma.storyLike.create({
      data: {
        storyId,
        userId,
      },
    });

    if (story.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: story.userId,
          type: 'STORY_LIKE',
          title: 'Story liked',
          message: 'Someone liked your story.',
          relatedUserId: userId,
          relatedStoryId: storyId,
        },
      });
    }

    res.json({ liked: true, message: 'Story liked' });
  } catch (error) {
    console.error('Error toggling story like:', error);
    res.status(500).json({ error: 'Failed to toggle story like' });
  }
});

module.exports = router;
