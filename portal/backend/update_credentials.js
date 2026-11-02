const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateCredentials() {
  const students = await prisma.student.findMany({
    include: {
      user: true
    }
  });

  for (const student of students) {
    if (student.user) {
      const firstName = student.name.split(' ')[0];
      const newPassword = `${firstName}@2609`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      console.log(`Updating ${student.name}: username -> ${student.name}, password -> ${newPassword}`);
      
      try {
        await prisma.user.update({
          where: { id: student.user_id },
          data: {
            username: student.name,
            password_hash: hashedPassword
          }
        });
      } catch (err) {
        console.error(`Failed to update ${student.name}:`, err.message);
      }
    }
  }
  
  console.log("Finished updating credentials!");
  process.exit(0);
}

updateCredentials();
