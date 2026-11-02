const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const s = await prisma.student.findUnique({ where: { student_id: 'STU005' }});
  console.log(s.profile_data);
}
main();
