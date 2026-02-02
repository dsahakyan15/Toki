const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken, setAuthCookie, clearAuthCookie, authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, password, username } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        error: 'Phone and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this phone number already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        username: username || `user_${Date.now()}`,
      },
      select: {
        id: true,
        phone: true,
        username: true,
        avatarUrl: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Set HttpOnly cookie
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({
        error: 'Phone and password are required',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid phone or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid phone or password',
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Set HttpOnly cookie
    setAuthCookie(res, token);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isPrivate: user.isPrivate,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (clear cookie)
 */
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        phone: true,
        username: true,
        avatarUrl: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
