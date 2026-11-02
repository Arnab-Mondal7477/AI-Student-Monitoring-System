const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');
const monitoringRoutes = require('./routes/monitoring');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Set io globally so routes can use it
app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve evidence files from the root of the project
const path = require('path');
app.use('/evidence', express.static(path.join(__dirname, '../../evidence')));
app.use('/faces', express.static(path.join(__dirname, 'public/faces')));

// Routes
const adminRoutes = require('./routes/admin');
const routineRoutes = require('./routes/routine');
app.use('/api/admin', adminRoutes);
app.use('/api/routine', routineRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'College Portal API is running' });
});

server.listen(PORT, () => {
  console.log(`Server and WebSockets running on port ${PORT}`);
});
