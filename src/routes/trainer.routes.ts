// src/routes/trainer.routes.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createTrainer } from '../controllers/trainer.controller';
import { getTrainersByFranchise } from '../controllers/trainer.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const trainers = await prisma.trainer.findMany({
      select: { id: true, name: true },
    });
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
});




router.get('/by-franchise/:franchiseId', authMiddleware, getTrainersByFranchise);

router.post('/', createTrainer);

// routes/trainer.routes.ts
router.get('/by-user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const trainer = await prisma.trainer.findUnique({
      where: { userId },
    });

    if (!trainer) return res.status(404).json({ error: 'Trainer not found' });

    res.json(trainer);
  } catch (err) {
    console.error('Error fetching trainer by userId:', err);
    res.status(500).json({ error: 'Failed to fetch trainer' });
  }
});

router.get('/count', async (req, res) => {
  try {
    const count = await prisma.trainer.count();
    res.json({ count });
  } catch (err) {
    console.error('Error fetching trainer count:', err);
    res.status(500).json({ error: 'Failed to fetch trainer count' });
  }
});



export default router;
