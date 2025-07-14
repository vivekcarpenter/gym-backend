// src/controllers/trainer.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTrainersByFranchise = async (req: Request, res: Response) => {
  const { franchiseId } = req.params;

  try {
    const trainers = await prisma.trainer.findMany({
      where: {
        clubId: franchiseId, // ✅ This matches your schema
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    res.json(trainers);
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ error: 'Error fetching trainers' });
  }
};
