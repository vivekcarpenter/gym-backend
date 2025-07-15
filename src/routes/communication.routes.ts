import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { memberId, note, type, content } = req.body;

  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { clubId: true }
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const created = await prisma.communication.create({
      data: {
        memberId,
        note,
        type,
        content,
        clubId: member.clubId, // fetch or derive from member if needed
      }
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save communication' });
  }
});

router.get('/:memberId', async (req, res) => {
  const { memberId } = req.params;

  try {
    const notes = await prisma.communication.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch communication notes' });
  }
});

export default router;
