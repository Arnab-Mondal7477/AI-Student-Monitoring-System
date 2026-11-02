const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.teacher.findUnique({ where: { user_id: 2 } });
  console.log("Teacher:", teacher);
  
  const violations = await prisma.violation.findMany({
    where: {
      OR: [
        { teacher_id: teacher.id }
      ]
    },
    include: { student: true }
  });
  console.log("Violations:", violations);
}
main();
