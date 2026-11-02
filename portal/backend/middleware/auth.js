const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifyToken = async (req, res, next) => {
  // DEMO BACKDOOR: Accept x-demo-username header from static HTML
  const demoUser = req.header('x-demo-username');
  if (demoUser) {
    try {
      const user = await prisma.user.findUnique({
        where: { username: demoUser },
        include: { student: true, teacher: true }
      });
      if (user) {
        req.user = { 
          id: user.id, 
          role: user.role, 
          username: user.username,
          studentId: user.student?.id,
          teacherId: user.teacher?.id
        };
        return next();
      }
    } catch (e) {
      console.error("Demo user lookup failed", e);
    }
  }

  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

const isStudent = (req, res, next) => {
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Access denied. Student only route.' });
  }
  next();
};

const isTeacher = (req, res, next) => {
  if (req.user.role !== 'TEACHER') {
    return res.status(403).json({ error: 'Access denied. Teacher only route.' });
  }
  next();
};

module.exports = { verifyToken, isStudent, isTeacher, JWT_SECRET };
