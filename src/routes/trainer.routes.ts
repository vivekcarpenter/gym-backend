// src/routes/trainer.routes.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';

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


// GET trainers for a franchise/club
router.get('/by-franchise/:clubId', async (req, res) => {
  const { clubId } = req.params;
  
  try {
    const trainers = await prisma.trainer.findMany({
      where: { clubId }
    });
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
});


export default router;
