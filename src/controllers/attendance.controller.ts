// src/controllers/attendance.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const getAttendanceByFilters = async (req: Request, res: Response) => {
  const { date, classId, trainerId, clubId } = req.query;

  try {
    const dateFilter =
      date
        ? {
            gte: new Date(`${date}T00:00:00.000Z`), // Start of the day
            lt: new Date(`${date}T23:59:59.999Z`),  // End of the day
          }
        : undefined;

    const schedules = await prisma.classSchedule.findMany({
      where: {
        ...(classId && { id: classId as string }),
        ...(trainerId && { trainerId: trainerId as string }),
        ...(date && { date: dateFilter }),
        ...(clubId && { clubId: clubId as string }),
      },
      include: {
        trainer: true,
        attendances: {
          include: {
            member: true,
          },
        },
        bookings: {
          include: {
            member: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.json(schedules);
  } catch (err) {
    console.error('Attendance fetch error:', err);
    res.status(500).json({ message: 'Error fetching attendance records' });
  }
};

// POST /attendance
// Mark attendance for multiple records (bulk)
export const markAttendance = async (req: Request, res: Response) => {
  const { records } = req.body;  // Attendance records to be updated or created

  try {
    const data = await prisma.$transaction(
      records.map((record: any) =>
        prisma.attendance.upsert({
          where: {
            memberId_scheduleId: {
              memberId: record.memberId,
              scheduleId: record.scheduleId,
            },
          },
          update: {
            status: record.status,   // "present" | "absent"
            markedAt: new Date(),
          },
          create: {
            memberId: record.memberId,
            scheduleId: record.scheduleId,
            status: record.status,
            markedAt: new Date(),
          },
        })
      )
    );

    res.json({ success: true, data });
  } catch (err) {
    console.error('Attendance update error:', err);
    res.status(500).json({ message: 'Error saving attendance' });
  }
};
