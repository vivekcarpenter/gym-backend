// src/controllers/checkin.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// export const getTodayLogs = async (req: Request, res: Response) => {
//   const start = new Date();
//   start.setHours(0, 0, 0, 0);
//   const end = new Date();
//   end.setHours(23, 59, 59, 999);

//   try {
//     const logs = await prisma.attendance.findMany({
//       where: {
//         markedAt: {
//           gte: start,
//           lte: end,
//         },
//       },
//       include: {
//         member: {
//           select: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//       orderBy: {
//         markedAt: 'desc',
//       },
//     });

//     const formatted = logs.map((log) => ({
//       memberName: `${log.member.firstName} ${log.member.lastName}`,
//       time: log.markedAt.toLocaleTimeString(),
//       status: log.status,
//     }));

//     res.json(formatted);
//   } catch (error) {
//     console.error('Error fetching today logs:', error);
//     res.status(500).json({ error: 'Failed to fetch check-in logs' });
//   }
// };


export const getTodayLogs = async (req: Request, res: Response) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  try {
    const logs = await prisma.attendance.findMany({
      where: {
        clubId: req.user?.clubId,
        markedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
    });

    const formatted = logs.map((log) => ({
      memberName: `${log.member.firstName} ${log.member.lastName}`,
      time: log.markedAt.toLocaleTimeString(),
      status: log.status,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching today logs:', error);
    res.status(500).json({ error: 'Failed to fetch check-in logs' });
  }
};



export const manualCheckIn = async (req: Request, res: Response) => {
  const { memberId } = req.body;

  if (!memberId) {
    return res.status(400).json({ error: 'Missing memberId' });
  }

  try {
    // Check for existing check-in for today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const alreadyCheckedIn = await prisma.attendance.findFirst({
      where: {
        memberId,
        markedAt: { gte: start, lte: end },
      },
    });

    if (alreadyCheckedIn) {
      return res.status(400).json({ error: 'Member already checked in today.' });
    }

    const newCheckIn = await prisma.attendance.create({
      data: {
    memberId,
    status: 'present',
    markedAt: new Date(),
    markedById: req.user?.id,
    clubId: req.user?.clubId,
    scheduleId: null, // ✅ THIS LINE IS MANDATORY
  },
    });

    res.status(201).json({ message: 'Check-in successful', data: newCheckIn });
  } catch (error) {
    console.error('Manual check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
};
