const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

async function main() {
  const user = await prisma.user.findUnique({ where: { id: 2 } }); // Dr. XYZ
  const token = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  const axios = require('axios');
  try {
    const res = await axios.get('http://127.0.0.1:5000/api/teacher/violations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
main();
