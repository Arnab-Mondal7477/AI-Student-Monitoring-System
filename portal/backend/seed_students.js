const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const studentsToSeed = [
    { student_id: 'Arnab', name: 'Arnab' },
    { student_id: 'STU001', name: 'John Doe' },
    { student_id: 'STU006', name: 'Alice Smith' },
    { student_id: 'STU007', name: 'Bob Jones' },
    { student_id: 'STU008', name: 'Charlie Brown' }
  ];

  const defaultPassword = await bcrypt.hash('123', 10);

  // Get a section to assign them to
  const section = await prisma.section.findFirst();

  for (const stu of studentsToSeed) {
    const existingUser = await prisma.user.findUnique({ where: { username: stu.student_id } });
    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          username: stu.student_id,
          password_hash: defaultPassword,
          role: 'STUDENT',
          student: {
            create: {
              student_id: stu.student_id,
              name: stu.name,
              email: `${stu.student_id.toLowerCase()}@example.com`,
              section_id: section ? section.id : null
            }
          }
        }
      });
      console.log(`Created user & student for ${stu.student_id}`);
    } else {
      console.log(`User ${stu.student_id} already exists.`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
