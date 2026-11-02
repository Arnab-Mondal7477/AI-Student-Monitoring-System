const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, isTeacher } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get teacher profile and dashboard info
router.get('/dashboard', verifyToken, isTeacher, async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: req.user.id },
      include: {
        subjects: true
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    res.json({
      profile: {
        name: teacher.name,
        teacher_code: teacher.teacher_code,
        contact_number: teacher.contact_number,
        email: teacher.email,
        department: teacher.department,
        designation: teacher.designation,
        experience: teacher.experience,
        salary: teacher.salary,
        profile_photo: teacher.profile_photo
      },
      subjects: teacher.subjects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher's assigned classes from Timetable
router.get('/classes', verifyToken, isTeacher, async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: req.user.id }
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { teacher_id: teacher.id },
      include: {
        subject: true,
        section: true,
        classroom: true
      },
      orderBy: {
        start_time: 'asc'
      }
    });

    // Map to the frontend expected format
    const formattedSlots = slots.map(slot => ({
      id: slot.id,
      day_of_week: slot.day_of_week, // e.g. "MON" -> frontend maps it to "Monday" or we map it here
      start_time: slot.start_time,
      end_time: slot.end_time,
      type: slot.type,
      subject: slot.subject.name,
      section: slot.section.name,
      building: 'Main Block', // Add real logic if available in DB
      floor: 'Ground Floor',
      room_number: slot.classroom.room_number
    }));

    // Convert short days like "MON" to "Monday" if needed
    const dayMap = {
      'MON': 'Monday', 'TUE': 'Tuesday', 'WED': 'Wednesday', 
      'THU': 'Thursday', 'FRI': 'Friday', 'SAT': 'Saturday', 'SUN': 'Sunday'
    };
    
    formattedSlots.forEach(slot => {
      if (dayMap[slot.day_of_week]) {
        slot.day_of_week = dayMap[slot.day_of_week];
      }
    });

    res.json(formattedSlots);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get assigned students based on department
// Optionally filter by semester or search by name
router.get('/students', verifyToken, isTeacher, async (req, res) => {
  try {
    const { search, semester } = req.query;
    const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.id } });
    
    let filter = { department: teacher.department };
    if (semester) filter.semester = parseInt(semester);
    if (search) {
      filter.OR = [
        { name: { contains: search } },
        { roll_number: { contains: search } }
      ];
    }

    const students = await prisma.student.findMany({
      where: filter,
      include: {
        attendances: true
      }
    });

    // Map to calculate their attendance
    const studentsWithStats = students.map(s => {
      const total = s.attendances.length;
      const attended = s.attendances.filter(a => a.status === 'PRESENT').length;
      let percentage = total > 0 ? (attended / total) * 100 : 0;
      return {
        id: s.id,
        name: s.name,
        roll_number: s.roll_number,
        department: s.department,
        semester: s.semester,
        cgpa: s.cgpa,
        overallAttendance: percentage.toFixed(1)
      };
    });

    res.json(studentsWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark attendance
router.post('/attendance', verifyToken, isTeacher, async (req, res) => {
  try {
    const { student_id, subject_id, date, status } = req.body;

    if (!student_id || !subject_id || !date || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.id } });

    // Validate that the subject belongs to the teacher
    const subject = await prisma.subject.findFirst({
      where: { id: subject_id, teacher_id: teacher.id }
    });

    if (!subject) {
      return res.status(403).json({ error: 'Not authorized for this subject' });
    }

    // Upsert attendance record (create if not exists, update if exists)
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);

    const record = await prisma.attendance.upsert({
      where: {
        student_id_subject_id_date: {
          student_id: parseInt(student_id),
          subject_id: parseInt(subject_id),
          date: targetDate
        }
      },
      update: { status },
      create: {
        student_id: parseInt(student_id),
        subject_id: parseInt(subject_id),
        teacher_id: teacher.id,
        date: targetDate,
        status: status
      }
    });

    res.json({ message: 'Attendance marked successfully', record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Violations for teacher's department or classes
router.get('/violations', verifyToken, isTeacher, async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { user_id: req.user.id } });
    
    // Fetch violations for this teacher specifically (from active classes)
    // or fallback to department level
    const violations = await prisma.violation.findMany({
      where: {
        teacher_id: teacher.id
      },
      include: {
        student: true
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

// Acknowledge a violation
router.post('/violations/:id/acknowledge', verifyToken, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const violation = await prisma.violation.update({
      where: { id: parseInt(id) },
      data: { status: status || 'ACKNOWLEDGED' }
    });

    res.json({ message: 'Violation acknowledged', violation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Review a violation
router.patch('/violations/:id/review', verifyToken, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_note } = req.body;
    
    const violation = await prisma.violation.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'REVIEWED',
        teacher_note: teacher_note || null 
      }
    });

    res.json({ message: 'Violation reviewed', violation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
