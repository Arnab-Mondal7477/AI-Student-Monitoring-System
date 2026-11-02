const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
const http = require('http');

async function main() {
  const user = await prisma.user.findUnique({ where: { id: 2 } }); // Dr. XYZ
  const token = jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  const req = http.request('http://127.0.0.1:5000/api/teacher/violations', {
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'DATA:', data));
  });
  req.on('error', console.error);
  req.end();
}
main();
