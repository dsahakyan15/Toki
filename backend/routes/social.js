const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function parseId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getRelationshipStatus(friendship) {
  if (!friendship) {
    return 'none';
  }

  if (friendship.status === 'ACCEPTED') {
    return 'friends';
  }

  if (friendship.status === 'PENDING') {
    return 'pending';
  }

  if (friendship.status === 'BLOCKED') {
    return 'blocked';
  }

  return 'none';
}

async function findFriendship(userId, otherUserId) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: otherUserId },
        { requesterId: otherUserId, addresseeId: userId },
      ],
    },
  });
}

async function getProfileAccess(profileId, viewerId) {
  const user = await prisma.user.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      isPrivate: true,
      createdAt: true,
    },
  });

  if (!user) {
    return { user: null, relationship: 'none', canViewFull: false };
  }

  if (!viewerId || viewerId === user.id) {
    return {
      user,
      relationship: viewerId === user.id ? 'self' : 'none',
      canViewFull: viewerId === user.id ? true : !user.isPrivate,
    };
  }

  const friendship = await findFriendship(viewerId, user.id);
  const relationship = getRelationshipStatus(friendship);
  const canViewFull = relationship === 'friends' || !user.isPrivate;

  return { user, relationship, canViewFull };
}

/**
 * POST /api/social/friends/request
 * Send a friend request to another user
 */
router.post('/friends/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const addresseeId = parseId(req.body.addresseeId ?? req.body.userId);

    if (!addresseeId) {
      return res.status(400).json({ error: 'addresseeId is required' });
    }

    if (addresseeId === userId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: addresseeId },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existing = await findFriendship(userId, addresseeId);
    if (existing) {
      if (existing.status === 'BLOCKED') {
        return res.status(403).json({ error: 'Cannot send request to this user' });
      }

      if (existing.status === 'ACCEPTED') {
        return res.status(409).json({ error: 'Users are already friends' });
      }

      if (existing.status === 'PENDING') {
        if (existing.requesterId === userId) {
          return res.status(409).json({ error: 'Friend request already sent' });
        }

        const accepted = await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 'ACCEPTED' },
        });

        await prisma.notification.create({
          data: {
            userId: addresseeId,
            type: 'FRIEND_ACCEPTED',
            title: 'Friend request accepted',
            message: 'You are now friends.',
            relatedUserId: userId,
          },
        });

        return res.json({
          message: 'Friend request accepted',
          status: accepted.status,
          friendship: accepted,
          autoAccepted: true,
        });
      }
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: userId,
        addresseeId,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: addresseeId,
        type: 'FRIEND_REQUEST',
        title: 'New friend request',
        message: 'Someone sent you a friend request.',
        relatedUserId: userId,
      },
    });

    return res.status(201).json({
      message: 'Friend request sent',
      status: friendship.status,
      friendship,
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
});

/**
 * POST /api/social/friends/accept
 * Accept a friend request
 */
router.post('/friends/accept', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requesterId = parseId(req.body.requesterId ?? req.body.userId);

    if (!requesterId) {
      return res.status(400).json({ error: 'requesterId is required' });
    }

    const pendingRequest = await prisma.friendship.findFirst({
      where: {
        requesterId,
        addresseeId: userId,
        status: 'PENDING',
      },
    });

    if (!pendingRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const friendship = await prisma.friendship.update({
      where: { id: pendingRequest.id },
      data: { status: 'ACCEPTED' },
    });

    await prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'FRIEND_ACCEPTED',
        title: 'Friend request accepted',
        message: 'Your friend request was accepted.',
        relatedUserId: userId,
      },
    });

    return res.json({
      message: 'Friend request accepted',
      status: friendship.status,
      friendship,
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

/**
 * GET /api/social/friends/requests
 * Get incoming friend requests
 */
router.get('/friends/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: 'PENDING',
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

/**
 * GET /api/social/friends
 * Get list of friends
 */
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const friends = friendships.map((friendship) =>
      friendship.requesterId === userId ? friendship.addressee : friendship.requester
    );

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

/**
 * GET /api/social/users/search
 * Search for users by username or phone
 */
router.get('/users/search', optionalAuth, async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const limit = parseId(req.query.limit) || 20;
    const viewerId = req.user?.id;

    if (!query) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
        ...(viewerId ? { id: { not: viewerId } } : {}),
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        isPrivate: true,
      },
      take: limit,
    });

    if (!viewerId || users.length === 0) {
      return res.json(
        users.map((user) => ({
          ...user,
          friendshipStatus: 'none',
        }))
      );
    }

    const userIds = users.map((user) => user.id);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: { in: userIds } },
          { requesterId: { in: userIds }, addresseeId: viewerId },
        ],
      },
      select: {
        requesterId: true,
        addresseeId: true,
        status: true,
      },
    });

    const statusByUserId = new Map();
    friendships.forEach((friendship) => {
      const otherId =
        friendship.requesterId === viewerId
          ? friendship.addresseeId
          : friendship.requesterId;
      statusByUserId.set(otherId, getRelationshipStatus(friendship));
    });

    return res.json(
      users.map((user) => ({
        ...user,
        friendshipStatus: statusByUserId.get(user.id) || 'none',
      }))
    );
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

/**
 * GET /api/social/users/:id
 * Get a user's profile data
 */
router.get('/users/:id', optionalAuth, async (req, res) => {
  try {
    const profileId = parseId(req.params.id);
    const viewerId = req.user?.id;

    if (!profileId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { user, relationship, canViewFull } = await getProfileAccess(profileId, viewerId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stats = null;
    if (canViewFull) {
      const [likedTracksCount, playlistsCount, friendsCount] = await Promise.all([
        prisma.like.count({ where: { userId: profileId } }),
        prisma.playlist.count({ where: { creatorId: profileId } }),
        prisma.friendship.count({
          where: {
            status: 'ACCEPTED',
            OR: [{ requesterId: profileId }, { addresseeId: profileId }],
          },
        }),
      ]);

      stats = {
        likedTracksCount,
        playlistsCount,
        friendsCount,
      };
    }

    return res.json({
      ...user,
      relationship,
      canViewFull,
      stats,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * GET /api/social/users/:id/likes
 * Get liked tracks for a user
 */
router.get('/users/:id/likes', optionalAuth, async (req, res) => {
  try {
    const profileId = parseId(req.params.id);
    const viewerId = req.user?.id;

    if (!profileId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { user, canViewFull } = await getProfileAccess(profileId, viewerId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!canViewFull) {
      return res.status(403).json({ error: 'Profile is private' });
    }

    const likes = await prisma.like.findMany({
      where: { userId: profileId },
      include: {
        track: true,
      },
      orderBy: { likedAt: 'desc' },
    });

    res.json(likes);
  } catch (error) {
    console.error('Error fetching liked tracks:', error);
    res.status(500).json({ error: 'Failed to fetch liked tracks' });
  }
});

/**
 * GET /api/social/users/:id/playlists
 * Get playlists for a user
 */
router.get('/users/:id/playlists', optionalAuth, async (req, res) => {
  try {
    const profileId = parseId(req.params.id);
    const viewerId = req.user?.id;

    if (!profileId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { user, canViewFull } = await getProfileAccess(profileId, viewerId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!canViewFull) {
      return res.status(403).json({ error: 'Profile is private' });
    }

    const playlists = await prisma.playlist.findMany({
      where: { creatorId: profileId },
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
 * GET /api/social/users/:id/friends
 * Get friends for a user
 */
router.get('/users/:id/friends', optionalAuth, async (req, res) => {
  try {
    const profileId = parseId(req.params.id);
    const viewerId = req.user?.id;

    if (!profileId) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { user, canViewFull } = await getProfileAccess(profileId, viewerId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!canViewFull) {
      return res.status(403).json({ error: 'Profile is private' });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: profileId }, { addresseeId: profileId }],
      },
      include: {
        requester: {
          select: { id: true, username: true, avatarUrl: true },
        },
        addressee: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });

    const friends = friendships.map((friendship) =>
      friendship.requesterId === profileId ? friendship.addressee : friendship.requester
    );

    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

module.exports = router;
