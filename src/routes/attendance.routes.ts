//// File: src/routes/attendance.routes.ts
import express from 'express';
import {
  getAttendanceForSchedule,
  markAttendance,
} from '../controllers/attendance.controller';
import { getAttendanceByFilters } from '../controllers/attendance.controller';


import { authMiddleware } from '../middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';


const router = express.Router();
const prisma = new PrismaClient();



              
router.get('/today', async (req, res) => {
  const { clubId } = req.query;

  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const count = await prisma.attendance.count({
      where: {
        clubId: String(clubId),
        markedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    res.json({ count });
  } catch (err) {
    console.error('Today attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});


router.get('/', authMiddleware, getAttendanceByFilters); // 👈 Now GET /api/attendance?clubId=...&startDate=... works



router.get('/schedule/:scheduleId', authMiddleware, getAttendanceForSchedule); // Get attendance for a specific class
router.post('/', authMiddleware, markAttendance); // Mark attendance (bulk)


export default router;
