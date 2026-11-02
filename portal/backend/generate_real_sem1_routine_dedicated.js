const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log("Setting up completely different teachers for Semester 1 subjects...");

  const subjectsData = [
    { code: 'BHS00001', name: 'English for Technical Communication', classes: 3, duration: 1, teacherName: 'Prof. Alan Turing' },
    { code: 'BHS00004', name: 'Understanding Harmony and Ethical Human Conduct', classes: 2, duration: 1, teacherName: 'Prof. Marie Curie' },
    { code: 'BBS00010', name: 'Engineering Chemistry', classes: 4, duration: 1, teacherName: 'Prof. Linus Pauling' },
    { code: 'BBS00005', name: 'Calculus', classes: 3, duration: 1, teacherName: 'Prof. Isaac Newton' },
    { code: 'BES00006', name: 'Programming for Problem Solving', classes: 4, duration: 1, teacherName: 'Prof. Ada Lovelace' },
    { code: 'BBS09020', name: 'Engineering Chemistry Lab', classes: 1, duration: 3, teacherName: 'Prof. Rosalind Franklin' }, 
    { code: 'BES09012', name: 'Programming for Problem Solving Lab', classes: 1, duration: 3, teacherName: 'Prof. Grace Hopper' }, 
    { code: 'BES09015', name: 'Workshop and Manufacturing Practices', classes: 1, duration: 3, teacherName: 'Prof. Nikola Tesla' }, 
    { code: 'BAU00002', name: 'Environmental Sciences', classes: 2, duration: 1, teacherName: 'Prof. Rachel Carson' }
  ];

  const sem1 = await prisma.semester.findFirst({ where: { level: 1 } });
  if (!sem1) throw new Error("Semester 1 not found!");

  const sections = await prisma.section.findMany({ where: { semester_id: sem1.id } });
  
  // Clear old routine for these sections
  for (const sec of sections) {
    await prisma.timetableSlot.deleteMany({ where: { section_id: sec.id } });
    await prisma.subjectAssignment.deleteMany({ where: { section_id: sec.id } });
  }

  const department = await prisma.department.findFirst();
  const createdSubjectsAndTeachers = [];

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create specialized teachers and subjects
  for (const s of subjectsData) {
    // Subject
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

    // Teacher User
    const username = s.teacherName.replace(/\s+/g, '').toLowerCase();
    let user = await prisma.user.findFirst({ where: { username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: username,
          password_hash: defaultPassword,
          role: 'TEACHER'
        }
      });
    }

    // Teacher Profile
    let teacher = await prisma.teacher.findFirst({ where: { user_id: user.id } });
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: {
          user_id: user.id,
          teacher_id: 'T_' + username.toUpperCase(),
          name: s.teacherName,
          email: `${username}@college.edu`,
          department: department.code,
          department_id: department.id,
          designation: 'Subject Expert'
        }
      });
    }

    createdSubjectsAndTeachers.push({
      subject: sub,
      teacher: teacher,
      classes: s.classes,
      duration: s.duration
    });
  }

  const classrooms = await prisma.classroom.findMany();
  
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const timeSlots = [
    { start: '09:00', end: '10:00', hour: 9 },
    { start: '10:00', end: '11:00', hour: 10 },
    { start: '11:00', end: '12:00', hour: 11 },
    { start: '12:00', end: '13:00', hour: 12 },
    { start: '14:00', end: '15:00', hour: 14 },
    { start: '15:00', end: '16:00', hour: 15 },
    { start: '16:00', end: '17:00', hour: 16 },
    { start: '17:00', end: '18:00', hour: 17 }
  ];

  const existingSlots = await prisma.timetableSlot.findMany();
  const teacherSchedule = {};
  const roomSchedule = {};
  
  // Track existing global slots
  for (const slot of existingSlots) {
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

  // 2. Assign and Schedule
  let roomIndex = 0;

  for (const sec of sections) {
    const room = classrooms[roomIndex % classrooms.length];
    roomIndex++;
    
    for (const data of createdSubjectsAndTeachers) {
      const sub = data.subject;
      const teacher = data.teacher;
      
      await prisma.subjectAssignment.create({
        data: {
          subject_id: sub.id,
          teacher_id: teacher.id,
          section_id: sec.id,
          semester_id: sem1.id,
          classes_week: data.classes,
          duration_min: data.duration * 60
        }
      });

      let scheduledCount = 0;
      const startDayIdx = Math.floor(Math.random() * days.length);

      for (let d = 0; d < days.length; d++) {
        if (scheduledCount >= data.classes) break;
        const day = days[(startDayIdx + d) % days.length];
        
        for (let t = 0; t < timeSlots.length; t++) {
          if (scheduledCount >= data.classes) break;
          
          const duration = data.duration;
          if (t + duration > timeSlots.length) continue;
          
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
            const endH = timeSlots[t + duration - 1].hour + 1;
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
            break; 
          }
        }
      }
    }
  }

  console.log("Routine successfully generated with dedicated subject experts!");
}

main().then(() => process.exit(0)).catch(console.error);
