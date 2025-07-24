//src>controllers>member.controller.ts
import { Request, Response } from 'express';
import { createNewMember } from '../services/member.service';
import prisma from '../lib/prisma';
import { email } from 'zod';

export const createMember = async (req: Request, res: Response) => {
  try {
const club = await prisma.club.findUnique({ where: { id: req.body.club } });
if (!club) {
  return res.status(400).json({ error: "Invalid club ID provided" });
}


    const member = await createNewMember(req.body);
    res.status(201).json(member);
  } catch (err) {
  console.error('[CREATE_MEMBER_ERROR]', err);
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Email already exists' });
  }

  res.status(500).json({ error: 'Failed to create member' });
}
};
export const getMembers = async (req: Request, res: Response) => {

    console.log('[GET_MEMBERS] Controller hit'); 


  const { page = 1, limit = 10, tab = 'all', search = '' } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const filters: any = {
    OR: [
      { firstName: { contains: String(search), mode: 'insensitive' } },
      { lastName: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
    ],
  };

  if (tab === 'active') filters.memberType = 'member';
  if (tab === 'prospect') filters.memberType = 'prospect';
  // Add others like `expired`, `recent` etc., later.

  try {
    const members = await prisma.member.findMany({
      where: filters,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.member.count({ where: filters });

    res.json({
      members,
      hasMore: skip + members.length < total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};


export const getMembersByTrainer = async (req: Request, res: Response) => {
  const { trainerId } = req.query;

  if (!trainerId) {
    return res.status(400).json({ error: 'Missing trainerId' });
  }

  try {
    // Find the trainer (could be by userId or direct trainer ID)
    const trainer = await prisma.trainer.findFirst({
      where: {
        OR: [
          { userId: trainerId as string }, // If trainerId is actually a User.id
          { id: trainerId as string },     // If trainerId is the actual Trainer.id
        ],
      },
      include: {
        members: {
          where: {
            memberType: 'member', // Only active members
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          orderBy: {
            firstName: 'asc',
          },
        },
      },
    });

    if (!trainer) {
      console.log(`No trainer found for ID: ${trainerId}`);
      return res.status(404).json({ error: 'Trainer not found' });
    }

    console.log(`Found trainer: ${trainer.name} with ${trainer.members.length} members`);

    res.json(trainer.members);
  } catch (err) {
    console.error('Error fetching trainer members:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/members/join-trend?clubId=...&range=30
export const getMemberJoinTrend = async (req: Request, res: Response) => {
  const { clubId, range } = req.query; // clubId will be undefined here for super_admin
  const days = parseInt(range as string) || 30;

  // IMPORTANT: The check for `!clubId` is GONE from here, as we want to allow optional clubId.
  // We don't want to return 400 if clubId is missing for a global trend.

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  let whereClause: any = {
    memberType: 'member',
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  // This `if (clubId)` block is key. If clubId is undefined (from frontend not sending it),
  // this block is skipped, and the query runs globally.
  if (clubId) { 
    whereClause.clubId = String(clubId);
    console.log(`Backend: clubId provided (${clubId}), fetching club-specific member join trend.`);
  } else {
    console.log('Backend: No clubId provided, fetching GLOBAL member join trend.');
  }

  console.log(`Backend: Fetching join trend with filters:`, whereClause);

  try {
    const members = await prisma.member.findMany({
      where: whereClause,
      select: { createdAt: true },
    });

    console.log(`Backend: Found ${members.length} members within the date range.`);

    const countByDate: Record<string, number> = {};
    for (let d = new Date(start); 
    d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      countByDate[key] = 0;
    }

    members.forEach((m) => {
      const key = m.createdAt.toISOString().split('T')[0];
      if (countByDate[key] !== undefined) {
        countByDate[key]++;
      }
    });

    const result = Object.entries(countByDate)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, count]) => ({
        date,
        count,
      }));

    res.json(result);
  } catch (err) {
    console.error('Join trend error:', err);
    res.status(500).json({ error: 'Failed to fetch join trend' });
  }
};