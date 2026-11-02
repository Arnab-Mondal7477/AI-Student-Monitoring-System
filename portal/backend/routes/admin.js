const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Middleware to verify Admin role (assuming it's attached via auth middleware)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// GET all students
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        section: true
      },
      orderBy: {
        student_id: 'asc'
      }
    });
    // Remove password hash from response
    const sanitized = students.map(s => {
      const { password, ...rest } = s;
      return rest;
    });
    res.json(sanitized);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET all violations
router.get('/violations', requireAdmin, async (req, res) => {
  try {
    const violations = await prisma.violation.findMany({
      include: {
        student: {
          include: { section: true }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    res.json(violations);
  } catch (err) {
    console.error('Error fetching violations:', err);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

// POST register a new student account (Admin pre-registers ID/Name)
router.post('/students', requireAdmin, async (req, res) => {
  try {
    const { student_id, name, section_id, profile_photo_base64, face_images, email, ...restBody } = req.body;

    if (!student_id || !name || !section_id) {
      return res.status(400).json({ error: 'student_id, name, and section_id are required' });
    }

    // Handle Image Upload
    let profile_photo = null;
    let face_registered = false;
    
    const fs = require('fs');
    const path = require('path');
    const facesDir = path.join(__dirname, '../public/faces');
    
    if (face_images || profile_photo_base64) {
      if (!fs.existsSync(facesDir)) {
        fs.mkdirSync(facesDir, { recursive: true });
      }
    }

    // Process multiple face images if provided
    if (face_images && typeof face_images === 'object') {
      const angles = ['front', 'left', 'right', 'up', 'down'];
      
      angles.forEach(angle => {
        if (face_images[angle]) {
          const base64Data = face_images[angle];
          const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const imageBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
          
          const filename = `${student_id}_${Date.now()}_${angle}.jpg`;
          const filepath = path.join(facesDir, filename);
          
          fs.writeFileSync(filepath, imageBuffer);
          
          // Use front image as main profile photo
          if (angle === 'front' && !profile_photo) {
            profile_photo = `/faces/${filename}`;
          }
          face_registered = true;
        }
      });
      
      // Fallback if front wasn't provided but others were
      if (face_registered && !profile_photo) {
        const firstAngle = Object.keys(face_images).find(k => face_images[k]);
        if (firstAngle) {
          const files = fs.readdirSync(facesDir);
          const matchingFile = files.find(f => f.startsWith(`${student_id}_`) && f.includes(`_${firstAngle}.jpg`));
          if (matchingFile) {
             profile_photo = `/faces/${matchingFile}`;
          }
        }
      }
    } 
    // Fallback for old single image upload
    else if (profile_photo_base64) {
      const matches = profile_photo_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const imageBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(profile_photo_base64, 'base64');
      
      const filename = `${student_id}_${Date.now()}.jpg`;
      const filepath = path.join(facesDir, filename);
      
      fs.writeFileSync(filepath, imageBuffer);
      profile_photo = `/faces/${filename}`;
      face_registered = true;
    }

    // Default password is FirstName@2609
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const firstName = name.split(' ')[0];
    const passwordStr = `${firstName}@2609`;
    const hashedPassword = await bcrypt.hash(passwordStr, salt);

    const newUser = await prisma.user.create({
      data: {
        username: student_id,
        password_hash: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            student_id,
            name,
            email: email || `${student_id}@ashgrove.edu`,
            section_id: parseInt(section_id),
            profile_photo,
            face_registered,
            profile_data: JSON.stringify({ email: email || `${student_id}@ashgrove.edu`, ...restBody })
          }
        }
      },
      include: {
        student: true
      }
    });

    const { password_hash, ...safeUser } = newUser;
    res.status(201).json(safeUser.student);

  } catch (err) {
    console.error('Error creating student:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Student ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// DELETE a student
router.delete('/students/:id', requireAdmin, async (req, res) => {
  try {
    const student_id = req.params.id;
    // Find the student to get their user_id
    const student = await prisma.student.findUnique({ where: { student_id } });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Deleting the user will cascade and delete the student record as well
    await prisma.user.delete({
      where: { id: student.user_id }
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// PUT update a student's profile data
router.put('/students/:id/profile', requireAdmin, async (req, res) => {
  try {
    const student_id = req.params.id;
    const { profile_photo_base64, face_images, name, section_id, email, ...restBody } = req.body;
    
    const extendedData = { ...restBody };
    if (email) extendedData.email = email;
    
    const updateData = { profile_data: JSON.stringify(extendedData) };
    if (name) updateData.name = name;
    if (section_id) updateData.section_id = parseInt(section_id);
    if (email) updateData.email = email;
    
    const fs = require('fs');
    const path = require('path');
    const facesDir = path.join(__dirname, '../public/faces');
    
    if (face_images || profile_photo_base64) {
      if (!fs.existsSync(facesDir)) {
        fs.mkdirSync(facesDir, { recursive: true });
      }
    }

    if (face_images && typeof face_images === 'object') {
      const angles = ['front', 'left', 'right', 'up', 'down'];
      let profile_photo = null;
      let face_registered = false;
      
      angles.forEach(angle => {
        if (face_images[angle]) {
          const base64Data = face_images[angle];
          const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const imageBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
          
          const filename = `${student_id}_${Date.now()}_${angle}.jpg`;
          const filepath = path.join(facesDir, filename);
          
          fs.writeFileSync(filepath, imageBuffer);
          
          if (angle === 'front' && !profile_photo) {
            profile_photo = `/faces/${filename}`;
          }
          face_registered = true;
        }
      });
      
      if (face_registered && !profile_photo) {
        const firstAngle = Object.keys(face_images).find(k => face_images[k]);
        if (firstAngle) {
          const files = fs.readdirSync(facesDir);
          const matchingFile = files.find(f => f.startsWith(`${student_id}_`) && f.includes(`_${firstAngle}.jpg`));
          if (matchingFile) {
             profile_photo = `/faces/${matchingFile}`;
          }
        }
      }
      
      if (profile_photo) updateData.profile_photo = profile_photo;
      if (face_registered) updateData.face_registered = true;
    }
    else if (profile_photo_base64) {
      const matches = profile_photo_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const imageBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(profile_photo_base64, 'base64');
      
      const filename = `${student_id}_${Date.now()}.jpg`;
      const filepath = path.join(facesDir, filename);
      
      fs.writeFileSync(filepath, imageBuffer);
      updateData.profile_photo = `/faces/${filename}`;
      updateData.face_registered = true;
    }
    
    await prisma.student.update({
      where: { student_id },
      data: updateData
    });
    
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET all sections for the dropdown
router.get('/sections', requireAdmin, async (req, res) => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        _count: {
          select: { students: true }
        },
        teachers: {
          include: {
            teacher: true
          }
        }
      }
    });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// POST a new section
router.post('/sections', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Section name is required' });
    
    const section = await prisma.section.create({
      data: { name }
    });
    res.status(201).json(section);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Section name already exists' });
    }
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// DELETE a section
router.delete('/sections/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.section.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Section deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

// GET all subjects
router.get('/subjects', requireAdmin, async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// GET all teachers
router.get('/teachers', requireAdmin, async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      orderBy: {
        teacher_id: 'asc'
      }
    });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// POST employ a new teacher
router.post('/teachers', requireAdmin, async (req, res) => {
  try {
    const { teacher_id, name, email, department, designation, experience, password, profile_photo_base64 } = req.body;

    if (!teacher_id || !name || !email) {
      return res.status(400).json({ error: 'teacher_id, name, and email are required' });
    }

    // Handle Image Upload
    let profile_photo = null;
    const fs = require('fs');
    const path = require('path');
    const facesDir = path.join(__dirname, '../public/faces');
    
    if (profile_photo_base64) {
      if (!fs.existsSync(facesDir)) {
        fs.mkdirSync(facesDir, { recursive: true });
      }

      const matches = profile_photo_base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      const imageBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(profile_photo_base64, 'base64');
      
      const filename = `teacher_${teacher_id}_${Date.now()}.jpg`;
      const filepath = path.join(facesDir, filename);
      
      fs.writeFileSync(filepath, imageBuffer);
      profile_photo = `/faces/${filename}`;
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordStr = password || `${name.split(' ')[0]}@2609`; // Default password if not provided
    const hashedPassword = await bcrypt.hash(passwordStr, salt);

    const newUser = await prisma.user.create({
      data: {
        username: teacher_id,
        password_hash: hashedPassword,
        role: 'TEACHER',
        teacher: {
          create: {
            teacher_id,
            name,
            email,
            department: department || "CSE",
            designation: designation || "Assistant Professor",
            experience: experience ? parseInt(experience) : 0,
            profile_photo
          }
        }
      },
      include: {
        teacher: true
      }
    });

    const { password_hash, ...safeUser } = newUser;
    res.status(201).json(safeUser.teacher);

  } catch (err) {
    console.error('Error creating teacher:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Teacher ID or Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// DELETE a teacher
router.delete('/teachers/:id', requireAdmin, async (req, res) => {
  try {
    const teacher_id = req.params.id; // This is the string ID like T_MRSHIV
    
    // Find the teacher to get their user_id
    const teacher = await prisma.teacher.findUnique({ where: { teacher_id } });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Deleting the user will cascade and delete the teacher record as well
    await prisma.user.delete({
      where: { id: teacher.user_id }
    });

    res.json({ message: 'Teacher deleted successfully' });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

// GET all classrooms
router.get('/classrooms', requireAdmin, async (req, res) => {
  try {
    const classrooms = await prisma.classroom.findMany();
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// GET timetable
router.get('/timetable', requireAdmin, async (req, res) => {
  try {
    const timetable = await prisma.timetableSlot.findMany({
      include: {
        section: true,
        subject: true,
        teacher: true,
        classroom: true
      },
      orderBy: [
        { day_of_week: 'asc' },
        { start_time: 'asc' }
      ]
    });
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// POST create timetable slot
router.post('/timetable', requireAdmin, async (req, res) => {
  try {
    const { section_id, subject_id, teacher_id, classroom_id, day_of_week, start_time, end_time } = req.body;

    // A real system would check for overlaps here.

    const slot = await prisma.timetableSlot.create({
      data: {
        section_id: parseInt(section_id),
        subject_id: parseInt(subject_id),
        teacher_id: parseInt(teacher_id),
        classroom_id: parseInt(classroom_id),
        day_of_week: day_of_week.toString(),
        start_time,
        end_time
      }
    });
    res.status(201).json(slot);
  } catch (err) {
    console.error('Error creating timetable slot:', err);
    res.status(500).json({ error: 'Failed to create slot' });
  }
});

// DELETE timetable slot
router.delete('/timetable/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.timetableSlot.delete({
      where: {
        id: parseInt(req.params.id)
      }
    });
    res.json({ message: 'Slot deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

module.exports = router;
