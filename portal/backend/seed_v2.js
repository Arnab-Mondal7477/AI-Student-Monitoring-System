const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding V2 Database...');

  // 1. Admin
  const adminPassword = await bcrypt.hash('SystemAdministrator@2609', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'System Administrator',
      password_hash: adminPassword,
      role: 'ADMIN',
      admin: {
        create: {
          name: 'System Administrator',
          email: 'admin@aismart.edu',
        }
      }
    }
  });
  console.log('Admin created.');

  // 2. Sections
  const sectionA = await prisma.section.create({ data: { name: 'Section A' } });
  const sectionB = await prisma.section.create({ data: { name: 'Section B' } });
  console.log('Sections created.');

  // 3. Classrooms & Labs
  const room204 = await prisma.classroom.create({ data: { room_number: '204', is_lab: false } });
  const lab2 = await prisma.classroom.create({ data: { room_number: 'Lab 2', is_lab: true } });
  console.log('Classrooms created.');

  // 4. Teachers
  const teacherPassword = await bcrypt.hash('Dr.XYZ@2609', 10);
  const teacherXYZ = await prisma.user.create({
    data: {
      username: 'Dr. XYZ',
      password_hash: teacherPassword,
      role: 'TEACHER',
      teacher: {
        create: {
          teacher_id: 'TCH001',
          name: 'Dr. XYZ',
          email: 'xyz@aismart.edu',
          department: 'CSE',
          designation: 'Professor',
          sections: {
            create: [
              { section_id: sectionA.id }
            ]
          }
        }
      }
    },
    include: { teacher: true }
  });
  console.log('Teacher created.');

  // 5. Subjects
  const osSubject = await prisma.subject.create({
    data: {
      code: 'CS301',
      name: 'Operating Systems',
      department: 'CSE',
      teachers: {
        create: [
          { teacher_id: teacherXYZ.teacher.id }
        ]
      }
    }
  });
  console.log('Subjects created.');

  // 6. Timetable - Make it active for TODAY based on current time
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const currentDay = days[now.getDay()];
  
  // Create a slot from 00:00 to 23:59 so it's always active for this test day
  await prisma.timetableSlot.create({
    data: {
      day_of_week: currentDay,
      start_time: '00:00',
      end_time: '23:59',
      type: 'THEORY',
      section_id: sectionA.id,
      subject_id: osSubject.id,
      teacher_id: teacherXYZ.teacher.id,
      classroom_id: room204.id
    }
  });
  console.log('Timetable Slot created for current day (' + currentDay + ').');

  // 7. Students
  const studentArnabPassword = await bcrypt.hash('Arnab@2609', 10);
  
  const studentArnab = await prisma.user.create({
    data: {
      username: 'Arnab Mondal',
      password_hash: studentArnabPassword,
      role: 'STUDENT',
      student: {
        create: {
          student_id: 'STU023',
          name: 'Arnab Mondal',
          email: 'arnab@aismart.edu',
          section_id: sectionA.id,
          course: 'B.Tech CSE',
          semester: 5
        }
      }
    }
  });
  
  const studentRahulPassword = await bcrypt.hash('Rahul@2609', 10);
  const studentRahul = await prisma.user.create({
    data: {
      username: 'Rahul Kumar',
      password_hash: studentRahulPassword,
      role: 'STUDENT',
      student: {
        create: {
          student_id: 'STU002',
          name: 'Rahul Kumar',
          email: 'rahul@aismart.edu',
          section_id: sectionA.id,
          course: 'B.Tech CSE',
          semester: 5
        }
      }
    }
  });
  console.log('Students created.');

  console.log('Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
