const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getCurrentDay(dateObj = new Date()) {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[dateObj.getDay()];
}

function isTimeActive(startTimeStr, endTimeStr, dateObj = new Date()) {
  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

async function getCurrentActiveClass(sectionId, timestamp = null) {
  const dateObj = timestamp ? new Date(timestamp) : new Date();
  const currentDay = getCurrentDay(dateObj);
  
  // 1. Try to find an explicitly active slot right now
  const todaysSlots = await prisma.timetableSlot.findMany({
    where: { section_id: sectionId, day_of_week: currentDay },
    include: { teacher: { include: { user: true } }, subject: true, classroom: true, section: true }
  });

  for (const slot of todaysSlots) {
    if (isTimeActive(slot.start_time, slot.end_time, dateObj)) return slot;
  }
  
  // 2. Fallback: If no class is strictly active right now, return the most recent class today
  if (todaysSlots.length > 0) {
    return todaysSlots[todaysSlots.length - 1]; 
  }

  // 3. Fallback: If no class today, return ANY class for this section (prototype efficiency)
  const anySlot = await prisma.timetableSlot.findFirst({
    where: { section_id: sectionId },
    include: { teacher: { include: { user: true } }, subject: true, classroom: true, section: true }
  });

  if (anySlot) return anySlot;

  // 4. Ultimate Fallback for Prototype: If this student's section has no timetable at all, 
  // route the alert to ANY existing active slot or teacher so it doesn't get lost.
  const ultimateFallback = await prisma.timetableSlot.findFirst({
    include: { teacher: { include: { user: true } }, subject: true, classroom: true, section: true }
  });

  return ultimateFallback;
}

async function getAllActiveClasses() {
  const currentDay = getCurrentDay();
  const allSlots = await prisma.timetableSlot.findMany({
    where: { day_of_week: currentDay },
    include: { teacher: true, subject: true, classroom: true, section: true }
  });

  return allSlots.filter(slot => isTimeActive(slot.start_time, slot.end_time, dateObj));
}

async function getCurrentActiveClassByRoom(roomNumber, timestamp = null) {
  const dateObj = timestamp ? new Date(timestamp) : new Date();
  const currentDay = getCurrentDay(dateObj);
  
  const room = await prisma.classroom.findUnique({
    where: { room_number: roomNumber }
  });

  if (!room) return null;

  const todaysSlots = await prisma.timetableSlot.findMany({
    where: { classroom_id: room.id, day_of_week: currentDay },
    include: { teacher: { include: { user: true } }, subject: true, classroom: true, section: true }
  });

  for (const slot of todaysSlots) {
    if (isTimeActive(slot.start_time, slot.end_time, dateObj)) return slot;
  }
  
  if (todaysSlots.length > 0) {
    return todaysSlots[todaysSlots.length - 1]; 
  }
  
  return null;
}

module.exports = { getCurrentDay, isTimeActive, getCurrentActiveClass, getAllActiveClasses, getCurrentActiveClassByRoom };
