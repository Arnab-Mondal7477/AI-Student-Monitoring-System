const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Setting up real Semester 1 subjects and generating routine...");

  const subjectsData = [
    { code: 'BHS00001', name: 'English for Technical Communication', classes: 3, duration: 1 },
    { code: 'BHS00004', name: 'Understanding Harmony and Ethical Human Conduct', classes: 2, duration: 1 },
    { code: 'BBS00010', name: 'Engineering Chemistry', classes: 4, duration: 1 },
    { code: 'BBS00005', name: 'Calculus', classes: 3, duration: 1 },
    { code: 'BES00006', name: 'Programming for Problem Solving', classes: 4, duration: 1 },
    { code: 'BBS09020', name: 'Engineering Chemistry Lab', classes: 1, duration: 2 }, // 2 hours
    { code: 'BES09012', name: 'Programming for Problem Solving Lab', classes: 1, duration: 2 }, // 2 hours
    { code: 'BES09015', name: 'Workshop and Manufacturing Practices', classes: 1, duration: 3 }, // 3 hours
    { code: 'BAU00002', name: 'Environmental Sciences', classes: 2, duration: 1 }
  ];

  // 1. Get Semester 1 (level 1)
  const sem1 = await prisma.semester.findFirst({ where: { level: 1 } });
  if (!sem1) throw new Error("Semester 1 not found!");

  // 2. Get Sections for Sem 1
  const sections = await prisma.section.findMany({ where: { semester_id: sem1.id } });
  
  // 3. Clear existing routine for these sections
  for (const sec of sections) {
    await prisma.timetableSlot.deleteMany({ where: { section_id: sec.id } });
    await prisma.subjectAssignment.deleteMany({ where: { section_id: sec.id } });
  }

  // Also optionally delete old CS101..105 dummy subjects if they are unassigned
  await prisma.subject.deleteMany({
    where: { code: { in: ['CS101', 'CS102', 'CS103', 'CS104', 'CS105'] } }
  }).catch(() => {}); // ignore error if they are assigned elsewhere

  // 4. Create the real subjects
  const department = await prisma.department.findFirst();
  const createdSubjects = [];
  for (const s of subjectsData) {
    let sub = await prisma.subject.findFirst({ where: { code: s.code } });
    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          code: s.code,
          name: s.name,
          department: department.code,
          department_id: department.id
        }
      });
    }
    // attach config so we can use it later
    createdSubjects.push({ ...sub, classes: s.classes, duration: s.duration });
  }

  // 5. Get Teachers (need 9 different teachers)
  const allTeachers = await prisma.teacher.findMany();
  
  // 6. Get Classrooms
  const classrooms = await prisma.classroom.findMany();
  
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  // We have slots from 09:00 to 18:00
  // Let's create an array of slot start times. Each slot is 1 hour.
  const timeSlots = [
    { start: '09:00', end: '10:00', hour: 9 },
    { start: '10:00', end: '11:00', hour: 10 },
    { start: '11:00', end: '12:00', hour: 11 },
    { start: '12:00', end: '13:00', hour: 12 },
    // 13:00 to 14:00 is Lunch Break
    { start: '14:00', end: '15:00', hour: 14 },
    { start: '15:00', end: '16:00', hour: 15 },
    { start: '16:00', end: '17:00', hour: 16 },
    { start: '17:00', end: '18:00', hour: 17 }
  ];

  // Track global schedule for teachers and rooms
  const existingSlots = await prisma.timetableSlot.findMany();
  const teacherSchedule = {};
  const roomSchedule = {};
  for (const slot of existingSlots) {
    // block out all hours for the duration of the slot
    const startHour = parseInt(slot.start_time.split(':')[0]);
    const endHour = parseInt(slot.end_time.split(':')[0]);
    for (let h = startHour; h < endHour; h++) {
      const key = `${slot.day_of_week}-${h}:00`;
      if (!teacherSchedule[slot.teacher_id]) teacherSchedule[slot.teacher_id] = new Set();
      teacherSchedule[slot.teacher_id].add(key);
      
      if (!roomSchedule[slot.classroom_id]) roomSchedule[slot.classroom_id] = new Set();
      roomSchedule[slot.classroom_id].add(key);
    }
  }

  // 7. Schedule!
  let tIndex = 0;
  let roomIndex = 0;

  for (const sec of sections) {
    const room = classrooms[roomIndex % classrooms.length];
    roomIndex++;
    
    // Each section gets its own set of 9 teachers for the 9 subjects
    for (let i = 0; i < createdSubjects.length; i++) {
      const sub = createdSubjects[i];
      const teacher = allTeachers[(tIndex + i) % allTeachers.length];
      
      await prisma.subjectAssignment.create({
        data: {
          subject_id: sub.id,
          teacher_id: teacher.id,
          section_id: sec.id,
          semester_id: sem1.id,
          classes_week: sub.classes,
          duration_min: sub.duration * 60
        }
      });

      // Schedule this subject
      let scheduledCount = 0;
      
      // randomize start day to spread out
      const startDayIdx = Math.floor(Math.random() * days.length);

      for (let d = 0; d < days.length; d++) {
        if (scheduledCount >= sub.classes) break;
        
        const day = days[(startDayIdx + d) % days.length];
        
        for (let t = 0; t < timeSlots.length; t++) {
          if (scheduledCount >= sub.classes) break;
          
          // Check if we can fit the duration
          const duration = sub.duration;
          if (t + duration > timeSlots.length) continue; // not enough consecutive slots
          
          // Ensure none of the slots cross lunch (e.g. start at 12 and end at 14)
          // Since lunch is skipped in timeSlots, if t + duration > t + something, we must ensure contiguous indices mean contiguous hours
          let isContiguous = true;
          for (let k = 0; k < duration - 1; k++) {
             if (timeSlots[t+k+1].hour - timeSlots[t+k].hour > 1) {
                isContiguous = false;
                break;
             }
          }
          if (!isContiguous) continue;

          let canSchedule = true;
          for (let k = 0; k < duration; k++) {
            const h = timeSlots[t+k].hour;
            const timeKey = `${day}-${h < 10 ? '0'+h : h}:00`;
            
            if (!teacherSchedule[teacher.id]) teacherSchedule[teacher.id] = new Set();
            if (!roomSchedule[room.id]) roomSchedule[room.id] = new Set();
            
            const secKey = `${sec.id}-${timeKey}`;
            if (!teacherSchedule[secKey]) teacherSchedule[secKey] = new Set();
            
            if (teacherSchedule[teacher.id].has(timeKey) || 
                roomSchedule[room.id].has(timeKey) || 
                teacherSchedule[secKey].has(timeKey)) {
              canSchedule = false;
              break;
            }
          }
          
          if (canSchedule) {
            // Book the slots
            for (let k = 0; k < duration; k++) {
              const h = timeSlots[t+k].hour;
              const timeKey = `${day}-${h < 10 ? '0'+h : h}:00`;
              
              teacherSchedule[teacher.id].add(timeKey);
              roomSchedule[room.id].add(timeKey);
              
              const secKey = `${sec.id}-${timeKey}`;
              teacherSchedule[secKey].add(timeKey);
            }
            
            const startH = timeSlots[t].hour;
            const startStr = `${startH < 10 ? '0'+startH : startH}:00`;
            const endH = timeSlots[t + duration - 1].hour + 1; // since it ends 1 hour later
            const endStr = `${endH < 10 ? '0'+endH : endH}:00`;
            
            await prisma.timetableSlot.create({
              data: {
                day_of_week: day,
                start_time: startStr,
                end_time: endStr,
                section_id: sec.id,
                subject_id: sub.id,
                teacher_id: teacher.id,
                classroom_id: room.id,
                type: sub.name.includes('Lab') || sub.name.includes('Workshop') ? 'PRACTICAL' : 'THEORY'
              }
            });
            scheduledCount++;
            break; // Move to next day for this subject
          }
        }
      }
    }
    tIndex += 9; // Shift teachers for the next section
  }

  console.log("Real Sem 1 Routine successfully generated!");
}

main().then(() => process.exit(0)).catch(console.error);
