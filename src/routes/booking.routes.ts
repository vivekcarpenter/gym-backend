import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Create a new booking
router.post('/', async (req, res) => {
  const { scheduleId, memberId, status } = req.body;

  if (!scheduleId || !memberId || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Check for duplicate booking
    const exists = await prisma.booking.findFirst({
      where: { scheduleId, memberId },
    });

    if (exists) {
      return res.status(400).json({ error: 'Member already booked in this class' });
    }

    const booking = await prisma.booking.create({
      data: {
        scheduleId,
        memberId,
        status,
      },
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error('Booking creation failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all bookings for a specific schedule (with member info)
router.get('/', async (req, res) => {
  const { scheduleId } = req.query;

  if (!scheduleId || typeof scheduleId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid scheduleId' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { scheduleId },
      include: {
        member: true,
      },
    });

    res.json(bookings);
  } catch (err) {
    console.error('Fetching bookings failed:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
