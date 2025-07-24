// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

export const getUsersByRole = async (req: Request, res: Response) => {
  const { role } = req.query;
   if (!role || typeof role !== 'string' || !Object.values(Role).includes(role as Role)) {
    return res.status(400).json({ error: 'Invalid or missing role' });
  }

  const users = await prisma.user.findMany({
    where: { role: role as Role },
    select: {
      id: true,
      email: true,
      name: true,
      clubId: true,
    },
  });

  res.json(users);
};

export const assignClubToUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { clubId } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { clubId },
    });

    res.json(updatedUser);
  } catch (err) {
    console.error('Error assigning club to user:', err);
    res.status(500).json({ error: 'Failed to assign club to user' });
  }
};
