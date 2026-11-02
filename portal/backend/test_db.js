const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const s = await prisma.student.findUnique({ where: { student_id: 'STU001' }});
  console.log('STU001 email:', s.email);
  console.log('STU001 profile_data email:', s.profile_data ? JSON.parse(s.profile_data).email : 'none');
}
run();
