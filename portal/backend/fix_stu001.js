const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const s = await prisma.student.findUnique({ where: { student_id: 'STU001' }});
  if (s) {
    let pd = {};
    if (s.profile_data) pd = JSON.parse(s.profile_data);
    pd.email = 'souvik.dey@gmail.com';
    
    await prisma.student.update({
      where: { student_id: 'STU001' },
      data: {
        email: 'souvik.dey@gmail.com',
        profile_data: JSON.stringify(pd)
      }
    });
    console.log('Fixed STU001!');
  }
}
run();
