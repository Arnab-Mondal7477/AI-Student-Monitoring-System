const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Routine Management Data...');

  // 1. College Settings
  const settings = await prisma.collegeSettings.create({
    data: {
      working_days: '1,2,3,4,5,6', // Mon-Sat
      start_time: '09:00',
      end_time: '17:00',
      period_duration: 60,
      lunch_start: '13:00',
      lunch_end: '14:00'
    }
  });
  console.log('College settings created.');

  // 2. Academic Year
  const year2627 = await prisma.academicYear.create({
    data: {
      name: '2026-27',
      start_date: new Date('2026-07-01'),
      end_date: new Date('2027-06-30'),
      is_active: true
    }
  });
  console.log('Academic year 2026-27 created.');

  // 3. Departments
  const cse = await prisma.department.create({ data: { code: 'CSE', name: 'Computer Science & Engineering' } });
  const ece = await prisma.department.create({ data: { code: 'ECE', name: 'Electronics & Communication Engineering' } });
  const me = await prisma.department.create({ data: { code: 'ME', name: 'Mechanical Engineering' } });
  
  // Link existing Teacher and Subject records to CSE Department where department === "CSE"
  await prisma.teacher.updateMany({
    where: { department: 'CSE' },
    data: { department_id: cse.id }
  });
  await prisma.subject.updateMany({
    where: { department: 'CSE' },
    data: { department_id: cse.id }
  });
  
  console.log('Departments created and existing records linked.');

  // 4. Semesters (For CSE)
  const cseSem1 = await prisma.semester.create({
    data: { name: '1st Semester', level: 1, academic_year_id: year2627.id, department_id: cse.id }
  });
  const cseSem3 = await prisma.semester.create({
    data: { name: '3rd Semester', level: 3, academic_year_id: year2627.id, department_id: cse.id }
  });
  const cseSem5 = await prisma.semester.create({
    data: { name: '5th Semester', level: 5, academic_year_id: year2627.id, department_id: cse.id }
  });
  const cseSem7 = await prisma.semester.create({
    data: { name: '7th Semester', level: 7, academic_year_id: year2627.id, department_id: cse.id }
  });

  // Link existing Sections to 5th Semester
  await prisma.section.updateMany({
    where: { name: { in: ['Section A', 'Section B'] } },
    data: { semester_id: cseSem5.id }
  });
  console.log('Semesters created and sections linked.');

  // 5. Subject Assignments
  // Find Teacher XYZ and OS subject
  const osSubject = await prisma.subject.findFirst({ where: { code: 'CS301' } });
  const teacherXYZ = await prisma.teacher.findFirst({ where: { teacher_id: 'TCH001' } });
  const sectionA = await prisma.section.findFirst({ where: { name: 'Section A' } });
  
  if (osSubject && teacherXYZ && sectionA) {
    await prisma.subjectAssignment.create({
      data: {
        subject_id: osSubject.id,
        teacher_id: teacherXYZ.id,
        section_id: sectionA.id,
        semester_id: cseSem5.id,
        classes_week: 3,
        duration_min: 60,
        class_type: 'THEORY'
      }
    });
    console.log('Sample subject assignment created.');
  }

  console.log('Routine Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
