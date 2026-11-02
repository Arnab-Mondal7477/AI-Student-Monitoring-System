const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const violations = await prisma.violation.findMany();
  console.log(violations);
}
main();
