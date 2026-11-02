const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Let's find an existing teacher and subject
  const teacher = await prisma.teacher.findFirst();
  const subject = await prisma.subject.findFirst({ where: { teacher_id: teacher.id } });
  
  if (!teacher || !subject) {
    console.log("No teacher or subject found in DB.");
    return;
  }
  
  console.log(`Creating ClassSession for ${teacher.name} / ${subject.subject_name}`);
  
  // Make an active class for right now
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
  const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  
  const startStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
  const endStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
  
  // We should make it for CS department, Semester 1 since STU002 is CS / Sem 1
  const session = await prisma.classSession.create({
    data: {
      subject_id: subject.id,
      teacher_id: teacher.id,
      department: "CS", // Make it match student's department
      semester: 1,      // Make it match student's semester
      section: "A",
      room: "301",
      start_time: startStr,
      end_time: endStr,
      date: new Date(dateStr)
    }
  });
  
  console.log("ClassSession created:", session);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
