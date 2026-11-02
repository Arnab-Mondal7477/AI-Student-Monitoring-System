const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const timetableService = require('../services/timetable');

const router = express.Router();
const prisma = new PrismaClient();

// This endpoint receives data from combined_monitor.py
router.post('/detections', async (req, res) => {
  try {
    const { student_id, object_name, detection_type, confidence, evidence_path, timestamp, location } = req.body;
    let student;
    
    // Resolve Student
    if (student_id && student_id !== 'UNKNOWN') {
      student = await prisma.student.findUnique({
        where: { student_id: student_id },
        include: { section: true }
      });
    }

    if (!student) {
      console.warn(`Violation received, but student ${student_id} not found in DB. Recording as UNKNOWN.`);
    }
    
    const type = detection_type || object_name || 'UNKNOWN';
    
    // Deduplication logic: Check if a similar violation exists within the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const existingViolation = await prisma.violation.findFirst({
      where: {
        student_id: student ? student.id : null,
        detection_type: type,
        timestamp: {
          gte: oneMinuteAgo
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    if (existingViolation) {
      console.log(`Deduplicating violation for ${student ? student.name : 'UNKNOWN'} (${type})`);
      return res.json({ message: 'Detection deduplicated successfully', violation: existingViolation });
    }

    // Timetable Resolution using our new engine
    let activeSlot = null;
    if (student && student.section_id) {
      activeSlot = await timetableService.getCurrentActiveClass(student.section_id, timestamp);
    }
    
    if (!activeSlot && location) {
      // If we don't know the student's section, try to infer the class from the camera's location
      activeSlot = await timetableService.getCurrentActiveClassByRoom(location, timestamp);
    }

    const filename = evidence_path ? path.basename(evidence_path) : null;

    const violation = await prisma.violation.create({
      data: {
        student_id: student ? student.id : null,
        teacher_id: activeSlot ? activeSlot.teacher_id : null,
        subject_id: activeSlot ? activeSlot.subject_id : null,
        section_id: activeSlot ? activeSlot.section_id : null,
        detection_type: type,
        confidence: confidence || 0.0,
        evidence_path: filename,
        status: 'NEW'
      },
      include: {
        student: true
      }
    });

    console.log(`Recorded violation for ${student ? student.name : 'UNKNOWN'}: ${violation.detection_type}`);
    
    // Emit WebSocket event if a teacher is associated
    const io = req.app.get('io');
    if (io) {
      if (activeSlot && activeSlot.teacher && activeSlot.teacher.user_id) {
        io.to(`teacher:${activeSlot.teacher.user_id}`).emit('ai_alert', violation);
        console.log(`Emitted real-time AI alert to teacher user_id:${activeSlot.teacher.user_id}`);
      }
      
      if (student && student.user_id) {
        io.to(`student:${student.user_id}`).emit('violation_report', violation);
      }
      
      // Also emit to all admins
      io.to('admin').emit('ai_alert', violation);
      console.log(`Emitted real-time AI alert to admins`);
    }

    res.json({ message: 'Detection recorded successfully', violation, activeSlot });
  } catch (error) {
    console.error('Error recording detection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint for AI system to fetch registered students
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: {
        student_id: true,
        name: true
      }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

module.exports = router;
