const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Routine for Semester 5 Section-E...');

  // 1. Create or get Department, AcademicYear, Semester, Section
  const cse = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {},
    create: { code: 'CSE', name: 'Computer Science & Engineering' }
  });

  const year2627 = await prisma.academicYear.upsert({
    where: { name: '2026-27' },
    update: {},
    create: { name: '2026-27', start_date: new Date('2026-07-01'), end_date: new Date('2027-06-30'), is_active: true }
  });

  let cseSem5;
  const existingSem5 = await prisma.semester.findFirst({
    where: { name: '5th Semester', academic_year_id: year2627.id, department_id: cse.id }
  });
  if (existingSem5) {
    cseSem5 = existingSem5;
  } else {
    cseSem5 = await prisma.semester.create({
      data: { name: '5th Semester', level: 5, academic_year_id: year2627.id, department_id: cse.id }
    });
  }

  const sectionE = await prisma.section.upsert({
    where: { name: 'Section E' },
    update: { semester_id: cseSem5.id },
    create: { name: 'Section E', semester_id: cseSem5.id }
  });

  // 2. Classrooms
  const rooms = [
    { room_number: '009', is_lab: false },
    { room_number: '301', is_lab: true },
    { room_number: '004', is_lab: true },
    { room_number: '406', is_lab: false },
    { room_number: '005', is_lab: true },
    { room_number: '002', is_lab: true },
  ];
  for (const r of rooms) {
    await prisma.classroom.upsert({
      where: { room_number: r.room_number },
      update: {},
      create: r
    });
  }

  // Helper function to create/get teacher
  async function getTeacher(name) {
    const defaultEmail = name.replace(/[\s\.\+]/g, '').toLowerCase() + '@brainware.edu';
    return await prisma.teacher.upsert({
      where: { email: defaultEmail },
      update: {},
      create: {
        teacher_id: 'T_' + name.replace(/[^A-Z0-9]/ig, '').substring(0, 6).toUpperCase(),
        name: name,
        email: defaultEmail,
        department: 'CSE',
        department_rel: { connect: { id: cse.id } },
        user: {
          create: {
            username: defaultEmail,
            password_hash: 'hashed_password', // Dummy
            role: 'TEACHER'
          }
        }
      }
    });
  }

  // Helper function to create/get subject
  async function getSubject(code, name) {
    return await prisma.subject.upsert({
      where: { code: code },
      update: {},
      create: { code, name, department: 'CSE', department_rel: { connect: { id: cse.id } } }
    });
  }

  // 3. Teachers
  const teachers = {
    shivananda: await getTeacher('MR. SHIVANANDA BISWAS'),
    abhik: await getTeacher('MR. ABHIK BHATTACHARYA'),
    sophiya: await getTeacher('MS. SOPHIYA KANGJAM'),
    ankita: await getTeacher('MS. ANKITA SINHA'),
    sumana: await getTeacher('MS. SUMANA SAMANTA'),
    syed: await getTeacher('DR. SYED IBTISAM NAFIS'),
    daizy: await getTeacher('DR. DAIZY DEB'),
    sourav: await getTeacher('MR. SOURAV NAG'),
    sreelekha: await getTeacher('MS. SREELEKHA PAUL'),
    purba: await getTeacher('MS. PURBA PAL'),
    mithun: await getTeacher('MR. MITHUN BISWAS')
  };

  // 4. Subjects
  const subjects = {
    cn: await getSubject('BTS50112', 'Computer Networks'),
    ds: await getSubject('BTS50113', 'Distributed System'),
    cd: await getSubject('BTS50114', 'Compiler Design'),
    pe: await getSubject('BTS50115', 'Professional Ethics'),
    ai_t: await getSubject('BTS57201A(T)', 'Artificial Intelligence (T)'),
    ai_p: await getSubject('BTS57201A(P)', 'Artificial Intelligence (P)'),
    cn_lab: await getSubject('BTS59116', 'Computer Networks Lab'),
    ds_lab: await getSubject('BTS59117', 'Distributed System Lab'),
    cd_lab: await getSubject('BTS59118', 'Compiler Design Lab'),
    tbc: await getSubject('TBC', 'TBC'),
    apt: await getSubject('APT-501', 'Aptitude')
  };

  // 5. Timetable Slots
  const getRoom = async (room_number) => await prisma.classroom.findUnique({ where: { room_number } });
  
  const slots = [
    // MON
    { day: 'MON', start: '12:00', end: '13:00', sub: subjects.ds, teach: teachers.shivananda, room: '009', type: 'THEORY' },
    { day: 'MON', start: '13:00', end: '14:00', sub: subjects.ai_t, teach: teachers.abhik, room: '009', type: 'THEORY' },
    { day: 'MON', start: '15:00', end: '16:00', sub: subjects.ds_lab, teach: teachers.shivananda, room: '301', type: 'LAB' }, // 8th
    { day: 'MON', start: '16:00', end: '17:00', sub: subjects.ds_lab, teach: teachers.shivananda, room: '301', type: 'LAB' }, // 9th
    { day: 'MON', start: '17:00', end: '18:00', sub: subjects.ds_lab, teach: teachers.shivananda, room: '301', type: 'LAB' }, // 10th

    // TUE - None

    // WED
    { day: 'WED', start: '10:00', end: '11:00', sub: subjects.ai_p, teach: teachers.abhik, room: '004', type: 'LAB' },
    { day: 'WED', start: '11:00', end: '12:00', sub: subjects.ai_p, teach: teachers.abhik, room: '004', type: 'LAB' },
    { day: 'WED', start: '13:00', end: '14:00', sub: subjects.apt, teach: teachers.sumana, room: '009', type: 'THEORY' },
    { day: 'WED', start: '14:00', end: '15:00', sub: subjects.apt, teach: teachers.sumana, room: '009', type: 'THEORY' },
    { day: 'WED', start: '15:00', end: '16:00', sub: subjects.ds, teach: teachers.shivananda, room: '009', type: 'THEORY' },
    { day: 'WED', start: '16:00', end: '17:00', sub: subjects.pe, teach: teachers.syed, room: '009', type: 'THEORY' },

    // THU
    { day: 'THU', start: '12:00', end: '13:00', sub: subjects.ai_t, teach: teachers.abhik, room: '009', type: 'THEORY' },
    { day: 'THU', start: '13:00', end: '14:00', sub: subjects.cn, teach: teachers.daizy, room: '009', type: 'THEORY' },
    { day: 'THU', start: '15:00', end: '16:00', sub: subjects.ds, teach: teachers.shivananda, room: '406', type: 'THEORY' },
    { day: 'THU', start: '16:00', end: '17:00', sub: subjects.cd_lab, teach: teachers.sourav, room: '002', type: 'LAB' },
    { day: 'THU', start: '17:00', end: '18:00', sub: subjects.cd_lab, teach: teachers.sourav, room: '002', type: 'LAB' },
    { day: 'THU', start: '18:00', end: '19:00', sub: subjects.cd_lab, teach: teachers.sourav, room: '002', type: 'LAB' },

    // FRI
    { day: 'FRI', start: '09:00', end: '10:00', sub: subjects.pe, teach: teachers.syed, room: '009', type: 'THEORY' },
    { day: 'FRI', start: '10:00', end: '11:00', sub: subjects.cn_lab, teach: teachers.daizy, room: '005', type: 'LAB' },
    { day: 'FRI', start: '11:00', end: '12:00', sub: subjects.cn_lab, teach: teachers.daizy, room: '005', type: 'LAB' },
    { day: 'FRI', start: '12:00', end: '13:00', sub: subjects.cd, teach: teachers.sourav, room: '009', type: 'THEORY' },
    { day: 'FRI', start: '13:00', end: '14:00', sub: subjects.ds, teach: teachers.shivananda, room: '009', type: 'THEORY' },
    { day: 'FRI', start: '14:00', end: '15:00', sub: subjects.cd, teach: teachers.sourav, room: '009', type: 'THEORY' },
    { day: 'FRI', start: '15:00', end: '16:00', sub: subjects.cd, teach: teachers.sourav, room: '009', type: 'THEORY' },
    { day: 'FRI', start: '16:00', end: '17:00', sub: subjects.cn, teach: teachers.daizy, room: '009', type: 'THEORY' },

    // SAT
    { day: 'SAT', start: '09:00', end: '10:00', sub: subjects.tbc, teach: teachers.mithun, room: '009', type: 'THEORY' },
    { day: 'SAT', start: '10:00', end: '11:00', sub: subjects.tbc, teach: teachers.mithun, room: '009', type: 'THEORY' },
    { day: 'SAT', start: '11:00', end: '12:00', sub: subjects.cd, teach: teachers.sourav, room: '009', type: 'THEORY' },
    { day: 'SAT', start: '12:00', end: '13:00', sub: subjects.cd, teach: teachers.sourav, room: '009', type: 'THEORY' },
    { day: 'SAT', start: '14:00', end: '15:00', sub: subjects.cn, teach: teachers.daizy, room: '009', type: 'THEORY' },
    { day: 'SAT', start: '15:00', end: '16:00', sub: subjects.cn, teach: teachers.daizy, room: '009', type: 'THEORY' },
  ];

  // Create Timetable Version
  const version = await prisma.timetableVersion.create({
    data: {
      academic_year_id: year2627.id,
      department_id: cse.id,
      semester_id: cseSem5.id,
      version_number: 1,
      status: 'PUBLISHED'
    }
  });

  // Insert slots
  for (const s of slots) {
    const room = await getRoom(s.room);
    await prisma.timetableSlot.create({
      data: {
        day_of_week: s.day,
        start_time: s.start,
        end_time: s.end,
        type: s.type,
        section_id: sectionE.id,
        subject_id: s.sub.id,
        teacher_id: s.teach.id,
        classroom_id: room.id,
        version_id: version.id
      }
    });
  }

  console.log('Seeding Routine Section E completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
