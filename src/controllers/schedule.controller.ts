// gym-api/src/controllers/schedule.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request to include user property from auth middleware
// interface AuthenticatedRequest extends Request {
//   user?: {
//     id: string; // User.id
//     profileId?: string; // Trainer.id or Member.id (if applicable)
//     role: string; // User.role
//     clubId?: string; // Club.id (for franchise_admin, trainer, member)
//     canCreateClasses?: boolean; // Trainer.canCreateClasses
//   };
// }

// ====================================================================================
// --- TRAINER-SPECIFIC CLASS MANAGEMENT FUNCTIONS ---
// = These functions operate on classes assigned to the logged-in trainer's profileId.
// ====================================================================================

// GET /api/schedule/trainer/my - Fetch classes for the logged-in trainer
export const getTrainerSchedule = async (req: Request, res: Response) => {
  const trainerId = req.user?.profileId; // Use profileId (Trainer.id)
  const userRole = req.user?.role;

  if (userRole !== 'trainer' || !trainerId) {
    return res.status(403).json({ error: 'Access denied. Trainer role required.' });
  }

  const { startDate, endDate, classType, status } = req.query;

  try {
    const classes = await prisma.classSchedule.findMany({
      where: {
        trainerId: trainerId, // Filter by the authenticated trainer's ID
        date: {
          gte: startDate ? new Date(String(startDate)) : undefined,
          lte: endDate ? new Date(String(endDate)) : undefined,
        },
        classType: classType ? String(classType) : undefined,
        status: status ? String(status) : undefined,
      },
      include: {
        trainer: { select: { name: true } }, // Include trainer name for display
        bookings: {
          where: { status: 'confirmed' }, // Count confirmed bookings
          select: { id: true }
        },
        attendances: { // Include for class attendance summary
          select: { id: true, status: true }
        },
        location: { select: { name: true } } // Include location name
      },
      orderBy: [{ date: 'asc' }],
    });

    const classesWithDetails = classes.map(cls => ({
      ...cls,
      date: cls.date.toISOString(), // Ensure it's an ISO string for frontend parsing
      trainerName: cls.trainer.name, // Use the name from the included trainer
      location: cls.location?.name || 'N/A', // Use location name
      currentAttendance: cls.bookings.length,
      totalAttended: cls.attendances.filter(att => att.status === 'present').length,
      totalAbsent: cls.attendances.filter(att => att.status === 'absent').length,
    }));

    res.json(classesWithDetails);
  } catch (error) {
    console.error('Error fetching trainer classes:', error);
    res.status(500).json({ error: 'Error fetching trainer classes' });
  }
};

// POST /api/schedule/trainer - Create a new class by trainer
export const createClass = async (req: AuthenticatedRequest, res: Response) => {
  const trainerId = req.user?.profileId; // Trainer's actual ID
  const clubId = req.user?.clubId; // Trainer's club ID
  const canCreateClasses = req.user?.canCreateClasses; // Permission from JWT

  if (req.user?.role !== 'trainer' || !trainerId || !clubId) {
    return res.status(403).json({ error: 'Access denied. Trainer role required.' });
  }
  if (!canCreateClasses) {
    return res.status(403).json({ error: 'Not authorized to create classes.' });
  }

  const { title, date, time, locationId, maxCapacity, duration, classType } = req.body;

  if (!title || !date || !time || !locationId || !maxCapacity || !duration || !classType) {
    return res.status(400).json({ error: 'Missing required fields to create class.' });
  }

  try {
    const classDateTime = new Date(`${date}T${time}:00`);

    const newClass = await prisma.classSchedule.create({
      data: {
        title,
        date: classDateTime,
        locationId,
        clubId,
        trainerId, // Auto-assign to logged-in trainer
        maxCapacity,
        duration,
        classType,
        status: 'scheduled',
      },
      include: {
        trainer: { select: { name: true } },
        location: { select: { name: true } }
      }
    });

    const formattedClass = {
        ...newClass,
        date: newClass.date.toISOString(),
        trainerName: newClass.trainer.name,
        location: newClass.location?.name || 'N/A',
        currentAttendance: 0,
        totalAttended: 0,
        totalAbsent: 0,
    };

    res.status(201).json(formattedClass);
  } catch (error) {
    console.error('Error creating class by trainer:', error);
    res.status(500).json({ error: 'Failed to create class.' });
  }
};

// PATCH /api/schedule/trainer/:id - Update a class by trainer
export const updateClass = async (req: AuthenticatedRequest, res: Response) => {
  const trainerId = req.user?.profileId;
  const { id } = req.params;
  const { title, date, time, locationId, maxCapacity, duration, classType, status } = req.body;

  if (req.user?.role !== 'trainer' || !trainerId) {
    return res.status(403).json({ error: 'Access denied. Trainer role required.' });
  }

  try {
    const existingClass = await prisma.classSchedule.findUnique({
      where: { id },
      select: { trainerId: true, date: true }
    });

    if (!existingClass || existingClass.trainerId !== trainerId) {
      return res.status(403).json({ error: 'Not authorized to update this class.' });
    }

    const updatedData: any = {
      title,
      locationId,
      maxCapacity,
      duration,
      classType,
      status
    };

    if (date && time) {
      updatedData.date = new Date(`${date}T${time}:00`);
    } else if (date) {
      const existingDateTime = existingClass.date;
      const newDate = new Date(date);
      newDate.setHours(existingDateTime.getHours(), existingDateTime.getMinutes(), existingDateTime.getSeconds(), existingDateTime.getMilliseconds());
      updatedData.date = newDate;
    } else if (time) {
        const existingDateTime = existingClass.date;
        const [hours, minutes] = time.split(':').map(Number);
        existingDateTime.setHours(hours, minutes, 0, 0);
        updatedData.date = existingDateTime;
    }

    const updatedClass = await prisma.classSchedule.update({
      where: { id },
      data: updatedData,
      include: {
        trainer: { select: { name: true } },
        bookings: { where: { status: 'confirmed' }, select: { id: true } },
        attendances: { select: { id: true, status: true } },
        location: { select: { name: true } }
      }
    });

    const formattedClass = {
        ...updatedClass,
        date: updatedClass.date.toISOString(),
        trainerName: updatedClass.trainer.name,
        location: updatedClass.location?.name || 'N/A',
        currentAttendance: updatedClass.bookings.length,
        totalAttended: updatedClass.attendances.filter(att => att.status === 'present').length,
        totalAbsent: updatedClass.attendances.filter(att => att.status === 'absent').length,
    };

    res.json(formattedClass);
  } catch (error) {
    console.error('Error updating class by trainer:', error);
    res.status(500).json({ error: 'Failed to update class.' });
  }
};

// DELETE /api/schedule/trainer/:id - Cancel a class by trainer (updates status to 'cancelled')
export const cancelClass = async (req: AuthenticatedRequest, res: Response) => {
  const trainerId = req.user?.profileId;
  const { id } = req.params;

  if (req.user?.role !== 'trainer' || !trainerId) {
    return res.status(403).json({ error: 'Access denied. Trainer role required.' });
  }

  try {
    const existingClass = await prisma.classSchedule.findUnique({
      where: { id },
      select: { trainerId: true }
    });

    if (!existingClass || existingClass.trainerId !== trainerId) {
      return res.status(403).json({ error: 'Not authorized to cancel this class.' });
    }

    const cancelledClass = await prisma.classSchedule.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    res.json(cancelledClass);
  } catch (error) {
    console.error('Error cancelling class by trainer:', error);
    res.status(500).json({ error: 'Failed to cancel class.' });
  }
};


// ====================================================================================
// --- FRANCHISE ADMIN-SPECIFIC CLASS MANAGEMENT FUNCTIONS ---
// - These functions allow admins to manage classes across their entire club.
// - They can fetch all classes, create classes for any trainer, and update/delete any class.
// ====================================================================================

// GET /api/schedule/admin/club - Fetch all classes for the logged-in franchise admin's club
export const getClassesByAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const adminClubId = req.user?.clubId;
  const userRole = req.user?.role;

  if (userRole !== 'franchise_admin' || !adminClubId) {
    return res.status(403).json({ error: 'Access denied. Franchise Admin role required.' });
  }

  const { startDate, endDate, classType, status, trainerId } = req.query; // Admin can filter by trainer

  try {
    const classes = await prisma.classSchedule.findMany({
      where: {
        clubId: adminClubId, // Filter by the admin's club
        trainerId: trainerId ? String(trainerId) : undefined, // Optional filter by trainer
        date: {
          gte: startDate ? new Date(String(startDate)) : undefined,
          lte: endDate ? new Date(String(endDate)) : undefined,
        },
        classType: classType ? String(classType) : undefined,
        status: status ? String(status) : undefined,
      },
      include: {
        trainer: { select: { id: true, name: true } }, // Include trainer ID and name
        bookings: {
  where: { status: 'confirmed' },
  include: {
    member: {
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    }
  }
},
        attendances: {
          select: { id: true, status: true }
        },
        location: { select: { name: true } }
      },
      orderBy: [{ date: 'asc' }],
    });

    const classesWithDetails = classes.map(cls => ({
      ...cls,
      date: cls.date.toISOString(),
      trainerName: cls.trainer.name,
      location: cls.location?.name || 'N/A',
      currentAttendance: cls.bookings.length,
      totalAttended: cls.attendances.filter(att => att.status === 'present').length,
      totalAbsent: cls.attendances.filter(att => att.status === 'absent').length,
    }));

    res.json(classesWithDetails);
  } catch (error) {
    console.error('Error fetching classes by admin:', error);
    res.status(500).json({ error: 'Error fetching classes by admin.' });
  }
};

// POST /api/schedule/admin - Create a new class by admin
export const createClassByAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const adminClubId = req.user?.clubId;
  const userRole = req.user?.role;

  if (userRole !== 'franchise_admin' || !adminClubId) {
    return res.status(403).json({ error: 'Access denied. Franchise Admin role required.' });
  }

  const { title, date, time, locationId, trainerId, maxCapacity, duration, classType, status } = req.body;

  if (!title || !date || !time || !locationId || !trainerId || !maxCapacity || !duration || !classType) {
    return res.status(400).json({ error: 'Missing required fields to create class.' });
  }

  try {
    const classDateTime = new Date(`${date}T${time}:00`);

    // Verify if the assigned trainer belongs to the admin's club
    const trainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
      select: { clubId: true }
    });

    if (!trainer || trainer.clubId !== adminClubId) {
      return res.status(400).json({ error: 'Invalid trainer ID or trainer does not belong to your club.' });
    }

    const newClass = await prisma.classSchedule.create({
      data: {
        title,
        date: classDateTime,
        locationId,
        clubId: adminClubId, // Assign to admin's club
        trainerId,          // Assign the specified trainer
        maxCapacity,
        duration,
        classType,
        status: status || 'scheduled', // Allow status to be set, default to 'scheduled'
      },
      include: {
        trainer: { select: { name: true } },
        location: { select: { name: true } }
      }
    });

    const formattedClass = {
        ...newClass,
        date: newClass.date.toISOString(),
        trainerName: newClass.trainer.name,
        location: newClass.location?.name || 'N/A',
        currentAttendance: 0,
        totalAttended: 0,
        totalAbsent: 0,
    };

    res.status(201).json(formattedClass);
  } catch (error) {
    console.error('Error creating class by admin:', error);
    res.status(500).json({ error: 'Failed to create class.' });
  }
};

// PATCH /api/schedule/admin/:id - Update a class by admin
export const updateClassByAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const adminClubId = req.user?.clubId;
  const userRole = req.user?.role;
  const { id } = req.params;
  const { title, date, time, locationId, trainerId, maxCapacity, duration, classType, status } = req.body;

  if (userRole !== 'franchise_admin' || !adminClubId) {
    return res.status(403).json({ error: 'Access denied. Franchise Admin role required.' });
  }

  try {
    const existingClass = await prisma.classSchedule.findUnique({
      where: { id },
      select: { clubId: true, date: true } // Select clubId to ensure admin can only update classes in their club
    });

    if (!existingClass || existingClass.clubId !== adminClubId) {
      return res.status(403).json({ error: 'Not authorized to update this class or class not found in your club.' });
    }

    // If trainerId is provided, verify it belongs to the admin's club
    if (trainerId) {
        const trainer = await prisma.trainer.findUnique({
            where: { id: trainerId },
            select: { clubId: true }
        });
        if (!trainer || trainer.clubId !== adminClubId) {
            return res.status(400).json({ error: 'Invalid trainer ID or trainer does not belong to your club.' });
        }
    }

    const updatedData: any = {
      title,
      locationId,
      trainerId, // Allow admin to change trainer
      maxCapacity,
      duration,
      classType,
      status
    };

    if (date && time) {
      updatedData.date = new Date(`${date}T${time}:00`);
    } else if (date) {
      const existingDateTime = existingClass.date;
      const newDate = new Date(date);
      newDate.setHours(existingDateTime.getHours(), existingDateTime.getMinutes(), existingDateTime.getSeconds(), existingDateTime.getMilliseconds());
      updatedData.date = newDate;
    } else if (time) {
        const existingDateTime = existingClass.date;
        const [hours, minutes] = time.split(':').map(Number);
        existingDateTime.setHours(hours, minutes, 0, 0);
        updatedData.date = existingDateTime;
    }

    const updatedClass = await prisma.classSchedule.update({
      where: { id },
      data: updatedData,
      include: {
        trainer: { select: { name: true } },
        bookings: { where: { status: 'confirmed' }, select: { id: true } },
        attendances: { select: { id: true, status: true } },
        location: { select: { name: true } }
      }
    });

    const formattedClass = {
        ...updatedClass,
        date: updatedClass.date.toISOString(),
        trainerName: updatedClass.trainer.name,
        location: updatedClass.location?.name || 'N/A',
        currentAttendance: updatedClass.bookings.length,
        totalAttended: updatedClass.attendances.filter(att => att.status === 'present').length,
        totalAbsent: updatedClass.attendances.filter(att => att.status === 'absent').length,
    };

    res.json(formattedClass);
  } catch (error) {
    console.error('Error updating class by admin:', error);
    res.status(500).json({ error: 'Failed to update class.' });
  }
};

// DELETE /api/schedule/admin/:id - Delete/Cancel a class by admin
export const deleteClassByAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const adminClubId = req.user?.clubId;
  const userRole = req.user?.role;
  const { id } = req.params;

  if (userRole !== 'franchise_admin' || !adminClubId) {
    return res.status(403).json({ error: 'Access denied. Franchise Admin role required.' });
  }

  try {
    const existingClass = await prisma.classSchedule.findUnique({
      where: { id },
      select: { clubId: true }
    });

    if (!existingClass || existingClass.clubId !== adminClubId) {
      return res.status(403).json({ error: 'Not authorized to delete this class or class not found in your club.' });
    }

    // Option 1: Mark as cancelled (recommended for history/auditing)
    const cancelledClass = await prisma.classSchedule.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    res.json(cancelledClass); // Return the updated class

    // Option 2: Hard delete (uncomment if you truly want to remove from DB)
    /*
    // First, delete related bookings and attendance records
    await prisma.booking.deleteMany({ where: { scheduleId: id } });
    await prisma.attendance.deleteMany({ where: { scheduleId: id } });

    // Then, delete the class schedule
    await prisma.classSchedule.delete({ where: { id } });
    res.status(204).send(); // No content for successful deletion
    */

  } catch (error) {
    console.error('Error deleting class by admin:', error);
    res.status(500).json({ error: 'Failed to delete class.' });
  }
};