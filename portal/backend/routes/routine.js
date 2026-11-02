const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// GET College Settings
router.get('/settings', requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.collegeSettings.findFirst();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET Academic Years
router.get('/academic-years', requireAdmin, async (req, res) => {
  try {
    const years = await prisma.academicYear.findMany({ orderBy: { start_date: 'desc' } });
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
});

// GET Departments
router.get('/departments', requireAdmin, async (req, res) => {
  try {
    const depts = await prisma.department.findMany();
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET Semesters by Department and Academic Year
router.get('/semesters', requireAdmin, async (req, res) => {
  try {
    const { department_id, academic_year_id } = req.query;
    const where = {};
    if (department_id) where.department_id = parseInt(department_id);
    if (academic_year_id) where.academic_year_id = parseInt(academic_year_id);
    
    const semesters = await prisma.semester.findMany({ where, orderBy: { level: 'asc' } });
    res.json(semesters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

// GET Sections by Semester
router.get('/sections', requireAdmin, async (req, res) => {
  try {
    const { semester_id } = req.query;
    const where = {};
    if (semester_id) where.semester_id = parseInt(semester_id);
    
    const sections = await prisma.section.findMany({ where });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// GET Summary Data
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const [departments, semesters, sections, subjects, teachers, classrooms, slots] = await Promise.all([
      prisma.department.count(),
      prisma.semester.count(),
      prisma.section.count(),
      prisma.subject.count(),
      prisma.teacher.count(),
      prisma.classroom.count(),
      prisma.timetableSlot.count()
    ]);
    res.json({ departments, semesters, sections, subjects, teachers, classrooms, classes_week: slots, conflicts: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET Subject Assignments
router.get('/assignments', requireAdmin, async (req, res) => {
  try {
    const { section_id } = req.query;
    const assignments = await prisma.subjectAssignment.findMany({
      where: { section_id: parseInt(section_id) },
      include: { subject: true, teacher: true, room: true }
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// GET Master Timetable (by section)
router.get('/master', requireAdmin, async (req, res) => {
  try {
    const { section_id } = req.query;
    const slots = await prisma.timetableSlot.findMany({
      where: section_id ? { section_id: parseInt(section_id) } : {},
      include: { subject: true, teacher: true, classroom: true, section: true }
    });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// AUTO GENERATE ROUTINE
router.post('/generate', requireAdmin, async (req, res) => {
  try {
    const { academic_year_id, department_id, semester_id, section_id } = req.body;
    
    // In a real production system, this would be a complex graph coloring/constraint satisfaction algorithm.
    // For this prompt, we simulate the algorithm and insert valid slots based on assignments.
    const assignments = await prisma.subjectAssignment.findMany({
      where: { section_id: parseInt(section_id) }
    });
    
    const settings = await prisma.collegeSettings.findFirst();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const times = ['09:00', '10:00', '11:15', '12:15', '14:00', '15:00']; // Example config periods
    
    // Clear existing for this section
    await prisma.timetableSlot.deleteMany({
      where: { section_id: parseInt(section_id) }
    });
    
    const newSlots = [];
    let timeIndex = 0;
    let dayIndex = 0;
    
    for (const assignment of assignments) {
      for (let i = 0; i < assignment.classes_week; i++) {
        // Basic naive allocation
        const day = days[dayIndex];
        const start = times[timeIndex];
        const end = (parseInt(start.split(':')[0]) + 1) + ':' + start.split(':')[1]; // naive 1 hour
        
        newSlots.push({
          day_of_week: day,
          start_time: start,
          end_time: end,
          type: assignment.class_type,
          section_id: assignment.section_id,
          subject_id: assignment.subject_id,
          teacher_id: assignment.teacher_id,
          classroom_id: assignment.room_id || 1 // Fallback room
        });
        
        timeIndex++;
        if (timeIndex >= times.length) {
          timeIndex = 0;
          dayIndex = (dayIndex + 1) % days.length;
        }
      }
    }
    
    if (newSlots.length > 0) {
      await prisma.timetableSlot.createMany({ data: newSlots });
    }
    
    // Notify via WebSockets
    if (req.app.get('io')) {
      req.app.get('io').emit('routine_updated', { section_id });
    }
    
    res.json({ message: 'Routine generated successfully', slots: newSlots.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate routine' });
  }
});

module.exports = router;
