//src/routes/schedule.routes.ts

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const router = express.Router();
const prisma = new PrismaClient();


// router.get('/', async (req: Request, res: Response) => {
//   const { clubId } = req.query;
//   if (!clubId) return res.status(400).json({ error: 'Club ID is required' });

//   try {
//     const schedules = await prisma.classSchedule.findMany({
//       where: { clubId: String(clubId) },
//       include: {
//         trainer: true,
//         bookings: {
//           include: { member: true },
//         }
//       },
//       orderBy: { date: 'asc' },
//     });
//     res.json(schedules);
//   } catch (err) {
//     console.error('Fetch schedules error:', err);
//     res.status(500).json({ error: 'Failed to fetch schedules' });
//   }
// });

// In schedule.routes.ts, update your GET route:
router.get('/', async (req: Request, res: Response) => {
  const { clubId, date, trainerId, classId } = req.query;
  
  if (!clubId) return res.status(400).json({ error: 'Club ID is required' });

  try {
    const whereClause: any = { clubId: String(clubId) };
    
    // Add date filtering if provided
    if (date) {
      const filterDate = new Date(String(date));
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.date = {
        gte: filterDate,
        lt: nextDay
      };
    }
    
    // Add trainer filtering if provided
    if (trainerId) {
      whereClause.trainerId = String(trainerId);
    }
    
    // Add specific class filtering if provided (though this might be redundant)
    if (classId) {
      whereClause.id = String(classId);
    }

    const schedules = await prisma.classSchedule.findMany({
      where: whereClause,
      include: {
        trainer: true,
        bookings: {
          include: { member: true },
        }
      },
      orderBy: { date: 'asc' },
    });
    
    res.json(schedules);
  } catch (err) {
    console.error('Fetch schedules error:', err);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});


// POST create new schedule
router.post('/', async (req: Request, res: Response) => {
  const {
    title,
    date,
    duration,
    location,
    trainerId,
    maxCapacity,
    clubId,
  } = req.body;

  try {
    const newSchedule = await prisma.classSchedule.create({
      data: {
        title,
        date: new Date(date),
        duration,
        locationId : null,
        trainerId,
        maxCapacity,
        clubId,
      },
    });
    res.status(201).json(newSchedule);
  } catch (err) {
    console.error('Create schedule error:', err);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
});

// DELETE a schedule by ID
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.classSchedule.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error('Delete schedule error:', err);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});



export default router;
