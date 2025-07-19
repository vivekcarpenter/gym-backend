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


export const getAttendanceForSchedule = async (req: Request, res: Response) => {
  const { scheduleId } = req.params;

  try {
    // Fetch all members who booked this class
    const bookings = await prisma.booking.findMany({
      where: { scheduleId },
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Fetch existing attendance records for this class
    const existingAttendance = await prisma.attendance.findMany({
      where: { scheduleId },
      select: { memberId: true, status: true, markedAt: true }
    });

    const attendanceMap = new Map();
    existingAttendance.forEach(att => attendanceMap.set(att.memberId, { status: att.status, markedAt: att.markedAt }));

    // Combine bookings with attendance status
    const membersWithStatus = bookings.map(booking => {
      const memberAttendance = attendanceMap.get(booking.member.id);
      return {
        memberId: booking.member.id,
        memberName: `${booking.member.firstName} ${booking.member.lastName}`,
        status: memberAttendance ? memberAttendance.status : 'pending', // 'present', 'absent', or 'pending'
        markedAt: memberAttendance ? memberAttendance.markedAt : null,
      };
    });

    res.json(membersWithStatus);
  } catch (err) {
    console.error('Error fetching attendance for schedule:', err);
    res.status(500).json({ error: 'Failed to fetch attendance for schedule.' });
  }
};