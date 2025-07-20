import express from 'express';
import { getDevicesByClub } from '../controllers/device.controller';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', getDevicesByClub);

router.get('/status', async (req, res) => {
  const { clubId } = req.query;
  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  try {
    const count = await prisma.device.count({
      where: {
        clubId: String(clubId),
        status: 'connected', // Assuming there's a `status` field
      },
    });

    res.json({ count });
  } catch (err) {
    console.error('Device status error:', err);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});


export default router;
