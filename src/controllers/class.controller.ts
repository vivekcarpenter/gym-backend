// src/controllers/class.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getClassesByFranchise = async (req: Request, res: Response) => {
  const { franchiseId } = req.params;

  try {
    const classes = await prisma.classSchedule.findMany({
      where: { clubId: franchiseId },
      select: {
        id: true,
        title: true,
        date: true,
        trainerId: true
      }
    });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Error fetching classes' });
  }
};
