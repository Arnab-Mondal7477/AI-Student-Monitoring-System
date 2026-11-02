const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixUsers() {
  // Delete users that have role STUDENT but no student record
  const students = await prisma.student.findMany();
  const validStudentUserIds = students.map(s => s.user_id);
  
  const allUsers = await prisma.user.findMany({ where: { role: 'STUDENT' }});
  
  for (const user of allUsers) {
    if (!validStudentUserIds.includes(user.id)) {
      console.log("Deleting orphaned user:", user.username);
      await prisma.user.delete({ where: { id: user.id } });
    }
  }

  // Run the update
  for (const student of students) {
    const firstName = student.name.split(' ')[0];
    const newPassword = `${firstName}@2609`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log(`Updating ${student.name}: username -> ${student.name}, password -> ${newPassword}`);
    
    await prisma.user.update({
      where: { id: student.user_id },
      data: {
        username: student.name,
        password_hash: hashedPassword
      }
    });
  }
  console.log("Fixed!");
}
fixUsers();
