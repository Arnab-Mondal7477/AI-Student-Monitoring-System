const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slots = await prisma.timetableSlot.findMany();
  console.log(slots);
}
main();
