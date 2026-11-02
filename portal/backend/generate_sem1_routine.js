const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Generating routine for Semester 1, 3 sections, 9 AM to 6 PM, 5 days...");

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const times = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '12:00', end: '13:00' },
    { start: '13:00', end: '14:00' }, // Lunch, but we can schedule it if needed
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' }
  ];

  // 1. Get Semester 1 (level 1)
  const sem1 = await prisma.semester.findFirst({ where: { level: 1 } });
  if (!sem1) throw new Error("Semester 1 not found!");

  // 2. Get Sections for Sem 1
  const sections = await prisma.section.findMany({ where: { semester_id: sem1.id } });
  console.log(`Found ${sections.length} sections for Sem 1.`);

  // 3. Clear existing routine for these sections
  for (const sec of sections) {
    await prisma.timetableSlot.deleteMany({ where: { section_id: sec.id } });
    await prisma.subjectAssignment.deleteMany({ where: { section_id: sec.id } });
  }

  // 4. Get 5 Subjects for Sem 1
  const subjects = await prisma.subject.findMany({ 
    where: { code: { in: ['CS101', 'CS102', 'CS103', 'CS104', 'CS105'] } } 
  });
  if (subjects.length < 5) throw new Error("Not enough Sem 1 subjects found!");

  // 5. Get Teachers (need at least 5 different teachers to assign "different subject for each subject")
  const allTeachers = await prisma.teacher.findMany();
  if (allTeachers.length < 5) throw new Error("Not enough teachers!");

  // 6. Get Classrooms
  const classrooms = await prisma.classroom.findMany();
  
  // Track global schedule for teachers and rooms across the whole college to avoid conflicts
  const existingSlots = await prisma.timetableSlot.findMany();
  const teacherSchedule = {};
  const roomSchedule = {};
  for (const slot of existingSlots) {
    const key = `${slot.day_of_week}-${slot.start_time}`;
    if (!teacherSchedule[slot.teacher_id]) teacherSchedule[slot.teacher_id] = new Set();
    teacherSchedule[slot.teacher_id].add(key);
    
    if (!roomSchedule[slot.classroom_id]) roomSchedule[slot.classroom_id] = new Set();
    roomSchedule[slot.classroom_id].add(key);
  }

  // 7. Schedule!
  let tIndex = 0;
  let roomIndex = 0;

  for (const sec of sections) {
    // Each section gets a dedicated room
    const room = classrooms[roomIndex % classrooms.length];
    roomIndex++;

    // Assign 5 subjects, each with a different teacher
    for (let i = 0; i < 5; i++) {
      const sub = subjects[i];
      const teacher = allTeachers[(tIndex + i) % allTeachers.length];
      
      // Create Subject Assignment (we'll schedule 5 classes per week for each subject)
      await prisma.subjectAssignment.create({
        data: {
          subject_id: sub.id,
          teacher_id: teacher.id,
          section_id: sec.id,
          semester_id: sem1.id,
          classes_week: 5 // 5 days a week -> 5 classes
        }
      });

      // Schedule 5 classes (1 per day if possible)
      let classesScheduled = 0;
      
      for (const day of days) {
        if (classesScheduled >= 5) break;
        
        for (const time of times) {
          if (time.start === '13:00') continue; // Skip lunch hour to be realistic
          if (classesScheduled >= 5) break;

          const timeKey = `${day}-${time.start}`;
          
          if (!teacherSchedule[teacher.id]) teacherSchedule[teacher.id] = new Set();
          if (!roomSchedule[room.id]) roomSchedule[room.id] = new Set();

          // Check if this specific section already has a class at this time
          const secKey = `${sec.id}-${timeKey}`;
          if (!teacherSchedule[secKey]) teacherSchedule[secKey] = new Set();
          
          if (!teacherSchedule[teacher.id].has(timeKey) && 
              !roomSchedule[room.id].has(timeKey) && 
              !teacherSchedule[secKey].has(timeKey)) {
              
            // Schedule it!
            teacherSchedule[teacher.id].add(timeKey);
            roomSchedule[room.id].add(timeKey);
            teacherSchedule[secKey].add(timeKey);
            
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
            break; // Move to next day for this subject to spread them out
          }
        }
      }
    }
    tIndex += 5; // ensure different set of teachers for next section, or shift it
  }

  console.log("Routine successfully generated for Semester 1!");
}

main().then(() => process.exit(0)).catch(console.error);
