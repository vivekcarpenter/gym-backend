// src/routes/checkin.routes.ts
import express from 'express';
import { getTodayLogs, manualCheckIn } from '../controllers/checkin.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/logs/today', authMiddleware, getTodayLogs);

router.post('/manual', authMiddleware, manualCheckIn);


router.get('/', authMiddleware, async (req, res) => {
  const { clubId, since = '24h' } = req.query;

  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  const hours = parseInt(String(since).replace('h', '')) || 24;
  const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const count = await prisma.attendance.count({
      where: {
        clubId: String(clubId),
        markedAt: { gte: sinceDate },
        status: 'present',
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting check-ins:', error);
    res.status(500).json({ error: 'Failed to fetch check-in count' });
  }
});


export default router;
