import { Request, Response } from 'express';
import { createNewMember } from '../services/member.service';
import prisma from '../lib/prisma';

export const getAllClubs = async (req: Request, res: Response) => {
  const clubs = await prisma.club.findMany();
  res.json(clubs);
};



export const createClub = async (req: Request, res: Response) => {
  const { name, location, timezone, clubEmail } = req.body;
  const newClub = await prisma.club.create({
    data: { name, location, timezone, clubEmail },
  });
  res.json(newClub);
};

export const updateClub = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, location, timezone, clubEmail } = req.body;
  const updated = await prisma.club.update({
    where: { id },
    data: { name, location, timezone, clubEmail },
  });
  res.json(updated);
};

export const deleteClub = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.club.delete({ where: { id } });
  res.status(204).send();
};

export const getClubById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'franchise_admin' },
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!club) return res.status(404).json({ error: 'Club not found' });

    res.json(club);
  } catch (error) {
    console.error('getClubById error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const getMembersByClub = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const members = await prisma.member.findMany({
      where: { clubId: id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        membership: {
          select: {
            planName: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

export const getClubTrainers = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const trainers = await prisma.trainer.findMany({
      where: { clubId: id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialization: true,
      },
    });

    res.json(trainers);
  } catch (err) {
    console.error('Failed to fetch trainers:', err);
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
};

export const getClubSchedules = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const schedules = await prisma.classSchedule.findMany({
      where: { clubId: id },
      include: {
        trainer: {
          select: { name: true, email: true }
        },
        location: {
          select: { name: true }
        }
      },
      orderBy: { date: 'asc' },
    });

    res.json(schedules);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

export const getClubInvoices = async (req: Request, res: Response) => {
  const { id } = req.params; // clubId
  try {
    const invoices = await prisma.invoice.findMany({
      where: { clubId: id },
      include: {
        member: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    res.json(invoices);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const suspendClub = async (req: Request, res: Response) => {
  const { id } = req.params;
  const club = await prisma.club.update({
    where: { id },
    data: { status: 'suspended' },
  });
  res.json(club);
};

export const activateClub = async (req: Request, res: Response) => {
  const { id } = req.params;
  const club = await prisma.club.update({
    where: { id },
    data: { status: 'active' },
  });
  res.json(club);
};







