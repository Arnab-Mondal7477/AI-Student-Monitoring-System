const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

async function test() {
  const user = await prisma.user.findUnique({ where: { username: 'Souvik Dey' } });
  const token = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '24h' }
  );
  
  try {
    const res = await fetch('http://localhost:5000/api/student/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("Error:", err.message);
  }
}
test();
