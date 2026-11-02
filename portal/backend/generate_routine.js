const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting full 4-year, 8-semester, 3-section timetable generation...");

  // 1. Get/Create Academic Year & Department
  let academicYear = await prisma.academicYear.findFirst();
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: { name: '2026-27', is_active: true }
    });
  }

  let department = await prisma.department.findFirst();
  if (!department) {
    department = await prisma.department.create({
      data: { code: 'CSE', name: 'Computer Science & Engineering' }
    });
  }

  // 2. Clear old timetable data so we don't have overlapping junk
  await prisma.timetableSlot.deleteMany();
  await prisma.subjectAssignment.deleteMany();
  
  // Optional: Do we delete all old sections/semesters? Yes, for a clean slate.
  // Wait, deleting sections might break foreign keys for students. Let's just create what's missing.

  // Ensure 8 Semesters
  const semesters = [];
  for (let level = 1; level <= 8; level++) {
    let sem = await prisma.semester.findFirst({
      where: { level, department_id: department.id, academic_year_id: academicYear.id }
    });
    if (!sem) {
      const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
      sem = await prisma.semester.create({
        data: {
          name: `${ordinals[level-1]} Semester`,
          level: level,
          academic_year_id: academicYear.id,
          department_id: department.id
        }
      });
    }
    semesters.push(sem);
  }

  // 3. Ensure 3 Sections per Semester
  const sectionLetters = ['A', 'B', 'C'];
  const sections = [];
  for (const sem of semesters) {
    for (const letter of sectionLetters) {
      const secName = `Sem ${sem.level} - Sec ${letter}`;
      let sec = await prisma.section.findFirst({ where: { name: secName }});
      if (!sec) {
        sec = await prisma.section.create({
          data: { name: secName, semester_id: sem.id }
        });
      }
      sections.push(sec);
    }
  }

  // 4. Create Subjects (5 per semester)
  const subjects = [];
  for (let level = 1; level <= 8; level++) {
    for (let i = 1; i <= 5; i++) {
      const code = `CS${level}0${i}`;
      let sub = await prisma.subject.findFirst({ where: { code }});
      if (!sub) {
        sub = await prisma.subject.create({
          data: {
            code,
            name: `Subject ${code}`,
            department: department.code,
            department_id: department.id
          }
        });
      }
      subjects.push(sub);
    }
  }

  // 5. Use Existing Teachers (We already have 12 teachers)
  let teachers = await prisma.teacher.findMany();
  if (teachers.length === 0) {
    throw new Error("No teachers found! Please seed users/teachers first.");
  }

  // 6. Create Classrooms (At least 24 to avoid clash)
  const classrooms = [];
  for (let i = 1; i <= 30; i++) {
    const rNum = `Room-${i}`;
    let r = await prisma.classroom.findFirst({ where: { room_number: rNum }});
    if (!r) {
      r = await prisma.classroom.create({
        data: { room_number: rNum, capacity: 60 }
      });
    }
    classrooms.push(r);
  }

  console.log(`Setup done: ${semesters.length} sems, ${sections.length} sections, ${subjects.length} subjects, ${teachers.length} teachers, ${classrooms.length} rooms.`);

  // 7. Assign Subjects to Sections & Generate Routine
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const times = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' }, // Lunch break usually, but let's just use it or skip it. Let's use 10:00 to 15:00.
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' }
  ];

  const teacherSchedule = {}; // track busy times for teachers: teacherId -> Set of `${day}-${start}`
  const roomSchedule = {};    // track busy times for rooms: roomId -> Set of `${day}-${start}`

  let roomIndex = 0;
  let teacherIndex = 0;

  for (const sem of semesters) {
    // Get 5 subjects for this semester
    const semSubjects = subjects.filter(s => s.code.startsWith(`CS${sem.level}0`));
    
    // For each section in this semester
    const semSections = sections.filter(s => s.semester_id === sem.id);
    for (const sec of semSections) {
      
      // We will assign exactly 5 subjects to this section, each having 3 classes per week
      for (const sub of semSubjects) {
        
        // Pick a teacher
        const teacher = teachers[teacherIndex % teachers.length];
        teacherIndex++;
        
        // Create subject assignment
        await prisma.subjectAssignment.create({
          data: {
            subject_id: sub.id,
            teacher_id: teacher.id,
            section_id: sec.id,
            semester_id: sem.id,
            classes_week: 3
          }
        });

        // Pick a dedicated room for this section to make it easy
        const room = classrooms[roomIndex % classrooms.length];
        
        // Schedule 3 classes for this subject-section-teacher combination
        let classesScheduled = 0;
        
        for (const day of days) {
          if (classesScheduled >= 3) break;
          
          for (const time of times) {
            if (classesScheduled >= 3) break;
            
            const timeKey = `${day}-${time.start}`;
            
            if (!teacherSchedule[teacher.id]) teacherSchedule[teacher.id] = new Set();
            if (!roomSchedule[room.id]) roomSchedule[room.id] = new Set();
            
            // Check for clashes
            if (!teacherSchedule[teacher.id].has(timeKey) && !roomSchedule[room.id].has(timeKey)) {
              // We can schedule!
              teacherSchedule[teacher.id].add(timeKey);
              roomSchedule[room.id].add(timeKey);
              
              await prisma.timetableSlot.create({
                data: {
                  day_of_week: day,
                  start_time: time.start,
                  end_time: time.end,
                  section_id: sec.id,
                  subject_id: sub.id,
                  teacher_id: teacher.id,
                  classroom_id: room.id,
                  type: 'THEORY'
                }
              });
              
              classesScheduled++;
            }
          }
        }
      }
      roomIndex++; // each section gets a different preferred room
    }
  }

  console.log("Timetable successfully generated without any clashes!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
