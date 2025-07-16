import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    const permissions = await prisma.permission.findMany({
      where: role ? { role: role as any } : {},
      orderBy: { key: 'asc' },
    });
    res.json(permissions);
  } catch (err) {
    console.error('Get permissions error:', err);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const updatePermission = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { allowed } = req.body;

  try {
    const updated = await prisma.permission.update({
      where: { id },
      data: { allowed },
    });
    res.json(updated);
  } catch (err) {
    console.error('Update permission error:', err);
    res.status(500).json({ error: 'Failed to update permission' });
  }
};
