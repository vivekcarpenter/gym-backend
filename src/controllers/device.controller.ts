import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getDevicesByClub = async (req: Request, res: Response) => {
  const { clubId } = req.query;
  if (!clubId) return res.status(400).json({ error: 'clubId is required' });

  const devices = await prisma.device.findMany({
    where: { clubId: String(clubId) },
    orderBy: { updatedAt: 'desc' },
  });

  res.json(devices);
};
