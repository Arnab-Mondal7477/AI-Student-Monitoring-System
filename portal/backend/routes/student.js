const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, isStudent } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get student profile and dashboard info
router.get('/dashboard', verifyToken, isStudent, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { user_id: req.user.id },
      include: {
        attendances: true,
        section: true
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Calculate overall attendance
    const totalClasses = student.attendances.length;
    const attendedClasses = student.attendances.filter(a => a.status === 'PRESENT').length;
    const missedClasses = totalClasses - attendedClasses;
    
    let overallAttendance = 0;
    if (totalClasses > 0) {
      overallAttendance = (attendedClasses / totalClasses) * 100;
    }

    // Since Attendance doesn't have a subject relation, we skip subjectWise stats
    const subjectWise = {};

    res.json({
      profile: {
        student_id: student.student_id,
        name: student.name,
        roll_number: student.roll_number,
        mobile_number: student.mobile_number,
        email: student.email,
        course: student.course,
        department: student.department,
        semester: student.semester,
        cgpa: student.cgpa,
        profile_photo: student.profile_photo,
        section: student.section ? student.section.name : null,
        profile_data: student.profile_data ? JSON.parse(student.profile_data) : {}
      },
      stats: {
        totalClasses,
        attendedClasses,
        missedClasses,
        overallAttendance: overallAttendance.toFixed(1)
      },
      subjectWiseAttendance: subjectWise
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's violations
router.get('/violations', verifyToken, isStudent, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });
    
    const violations = await prisma.violation.findMany({
      where: {
        student_id: student.id
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    res.json(violations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Appeal a violation
router.post('/violations/:id/appeal', verifyToken, isStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });

    // Verify the violation belongs to this student
    const existing = await prisma.violation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing || existing.student_id !== student.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const violation = await prisma.violation.update({
      where: { id: parseInt(id) },
      data: { status: 'APPEALED' }
    });

    res.json({ message: 'Violation appealed', violation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Acknowledge a violation
router.post('/violations/:id/acknowledge', verifyToken, isStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { user_id: req.user.id } });

    const existing = await prisma.violation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing || existing.student_id !== student.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const violation = await prisma.violation.update({
      where: { id: parseInt(id) },
      data: { student_acknowledged: true }
    });

    res.json({ message: 'Violation acknowledged', violation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
