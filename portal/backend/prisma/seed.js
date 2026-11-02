const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.attendance.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  // Create demo Student
  const studentHash = await bcrypt.hash('Student@123', 10);
  const userStudent = await prisma.user.create({
    data: {
      username: 'student001',
      password_hash: studentHash,
      role: 'STUDENT',
      student: {
        create: {
          name: 'Alex Johnson',
          roll_number: 'CS2024-001',
          mobile_number: '+1 555-0101',
          email: 'alex.j@college.edu',
          course: 'B.Tech Computer Science',
          department: 'Computer Science',
          semester: 4,
          cgpa: 8.5
        }
      }
    },
    include: { student: true }
  });

  // Create demo Teacher
  const teacherHash = await bcrypt.hash('Teacher@123', 10);
  const userTeacher = await prisma.user.create({
    data: {
      username: 'teacher001',
      password_hash: teacherHash,
      role: 'TEACHER',
      teacher: {
        create: {
          name: 'Dr. Sarah Williams',
          teacher_code: 'T-CS-042',
          contact_number: '+1 555-0202',
          email: 's.williams@college.edu',
          department: 'Computer Science',
          designation: 'Associate Professor',
          experience: 12,
          salary: 85000
        }
      }
    },
    include: { teacher: true }
  });

  // Create some subjects for the teacher
  const subject1 = await prisma.subject.create({
    data: {
      subject_code: 'CS401',
      subject_name: 'Database Management Systems',
      department: 'Computer Science',
      semester: 4,
      teacher_id: userTeacher.teacher.id
    }
  });

  const subject2 = await prisma.subject.create({
    data: {
      subject_code: 'CS402',
      subject_name: 'Operating Systems',
      department: 'Computer Science',
      semester: 4,
      teacher_id: userTeacher.teacher.id
    }
  });

  // Create sample attendance
  const today = new Date();
  today.setHours(0,0,0,0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.attendance.createMany({
    data: [
      {
        student_id: userStudent.student.id,
        subject_id: subject1.id,
        teacher_id: userTeacher.teacher.id,
        date: yesterday,
        status: 'PRESENT'
      },
      {
        student_id: userStudent.student.id,
        subject_id: subject2.id,
        teacher_id: userTeacher.teacher.id,
        date: yesterday,
        status: 'PRESENT'
      }
    ]
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
