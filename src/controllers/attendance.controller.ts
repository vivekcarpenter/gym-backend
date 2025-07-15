// src/controllers/attendance.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const getAttendanceByFilters = async (req: Request, res: Response) => {
  const { clubId, startDate, endDate } = req.query;

  if (!clubId) return res.status(400).json({ error: 'Missing clubId' });

  try {
    const schedules = await prisma.classSchedule.findMany({
      where: {
        clubId: String(clubId),
        date: {
          gte: startDate ? new Date(String(startDate)) : undefined,
          lte: endDate ? new Date(String(endDate)) : undefined,
        },
      },
      include: {
        attendances: {
          include: { member: true },
        },
      },
    });

    const attendanceMap = new Map();

    for (const schedule of schedules) {
      for (const record of schedule.attendances) {
        const id = record.member.id;
        const key = `${id}`;
        const existing = attendanceMap.get(key) || {
          memberName: `${record.member.firstName} ${record.member.lastName}`,
          total: 0,
          noShows: 0,
          lastVisit: '',
        };

        existing.total += 1;
        if (record.status === 'absent') {
          existing.noShows += 1;
        }

        if (!existing.lastVisit || new Date(schedule.date) > new Date(existing.lastVisit)) {
          existing.lastVisit = schedule.date.toISOString();
        }

        attendanceMap.set(key, existing);
      }
    }

    const result = Array.from(attendanceMap.values());

    res.json(result);
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
