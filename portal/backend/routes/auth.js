const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const normalizedRole = role ? role.toUpperCase() : null;

    if (!username || !password || !normalizedRole) {
      return res.status(400).json({ error: 'Username, password and role are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { student: { name: username } },
          { student: { student_id: username } },
          { teacher: { name: username } },
          { teacher: { teacher_id: username } }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role !== normalizedRole) {
      return res.status(401).json({ error: 'Invalid role selection' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, name } = req.body;
    const normalizedRole = role ? role.toUpperCase() : null;

    if (!username || !password || !normalizedRole || !name) {
      return res.status(400).json({ error: 'Username, password, role, and name are required' });
    }
    
    if (normalizedRole !== 'STUDENT' && normalizedRole !== 'TEACHER') {
      return res.status(400).json({ error: 'Role must be student or teacher' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the User and nested Student/Teacher profile
    const newUser = await prisma.user.create({
      data: {
        username,
        password_hash: hashedPassword,
        role: normalizedRole,
        ...(normalizedRole === 'STUDENT' ? {
          student: {
            create: {
              name,
              roll_number: `STU${Math.floor(1000 + Math.random() * 9000)}`,
              email: `${username}@ashgrove.edu`,
              course: 'B.Tech',
              department: 'Computer Science',
              semester: 1
            }
          }
        } : {
          teacher: {
            create: {
              name,
              teacher_code: `TCH${Math.floor(100 + Math.random() * 900)}`,
              email: `${username}@ashgrove.edu`,
              department: 'Computer Science',
              designation: 'Assistant Professor'
            }
          }
        })
      }
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        name
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/me', verifyToken, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
