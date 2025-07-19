import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    clubId?: string;
    role: string;
  };
}

export const getLocationsByClub = async (req: AuthenticatedRequest, res: Response) => {
  const clubId = req.user?.clubId; // Get clubId from authenticated user
  if (!clubId) {
    return res.status(400).json({ error: 'Club ID is required.' });
  }

  try {
    const locations = await prisma.location.findMany({
      where: { clubId: clubId },
      select: { id: true, name: true }, // Only need ID and name for the dropdown
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations.' });
  }
};
