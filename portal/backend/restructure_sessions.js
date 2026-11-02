const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Restructuring Academic Years into 4 distinct sessions...");

  // Delete or rename the "2024-28" one if it exists
  const oldAy = await prisma.academicYear.findFirst({ where: { name: '2024-28' } });
  if (oldAy) {
    await prisma.academicYear.update({
      where: { id: oldAy.id },
      data: { name: '2024-25' }
    });
  }

  // Define the sessions
  const sessions = ["2024-25", "2025-26", "2026-27", "2027-28"];
  const sessionRecords = [];

  for (const sessionName of sessions) {
    let ay = await prisma.academicYear.findFirst({ where: { name: sessionName } });
    if (!ay) {
      ay = await prisma.academicYear.create({
        data: { name: sessionName, is_active: sessionName === "2024-25" }
      });
    }
    sessionRecords.push(ay);
  }

  // Ensure we get the latest session IDs
  for (let i = 0; i < 4; i++) {
    sessionRecords[i] = await prisma.academicYear.findFirst({ where: { name: sessions[i] } });
  }

  // Now re-assign Semesters
  // Sem 1, 2 -> 2024-25
  // Sem 3, 4 -> 2025-26
  // Sem 5, 6 -> 2026-27
  // Sem 7, 8 -> 2027-28

  const semesters = await prisma.semester.findMany();
  
  for (const sem of semesters) {
    let targetAyId = null;
    
    if (sem.level === 1 || sem.level === 2) targetAyId = sessionRecords[0].id;
    else if (sem.level === 3 || sem.level === 4) targetAyId = sessionRecords[1].id;
    else if (sem.level === 5 || sem.level === 6) targetAyId = sessionRecords[2].id;
    else if (sem.level === 7 || sem.level === 8) targetAyId = sessionRecords[3].id;

    if (targetAyId && sem.academic_year_id !== targetAyId) {
      await prisma.semester.update({
        where: { id: sem.id },
        data: { academic_year_id: targetAyId }
      });
      console.log(`Updated Semester ${sem.level} to Academic Year ${sessions[Math.floor((sem.level-1)/2)]}`);
    }
  }

  console.log("Database restructuring complete!");
}

main().then(() => process.exit(0)).catch(console.error);
