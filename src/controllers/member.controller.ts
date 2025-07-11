import { Request, Response } from 'express';
import { createNewMember } from '../services/member.service';
import prisma from '../lib/prisma';

export const createMember = async (req: Request, res: Response) => {
  try {
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

