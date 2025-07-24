// gym-api/src/routes/schedule.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware'; 
import { PrismaClient } from '@prisma/client';

import {
  getTrainerSchedule,
  createClass,         // Trainer creates their own class
  updateClass,         // Trainer updates their own class
  cancelClass,         // Trainer cancels their own class
  getClassesByAdmin,   // Admin fetches classes for their club
  createClassByAdmin,  // Admin creates a class (assigns trainer)
  updateClassByAdmin,  // Admin updates any class in their club
  deleteClassByAdmin   // Admin deletes/cancels any class in their club
} from '../controllers/schedule.controller'; // Import all consolidated controller functions

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { limit = 5, clubId } = req.query; // Add clubId to query params
  const take = Number(limit);

  let whereClause: any = {}; // Initialize as empty object

  if (clubId) {
    whereClause.clubId = String(clubId);
  } else {
    console.log('Backend /api/schedule: No clubId provided, fetching GLOBAL schedules.');
  }

  try {
    const schedules = await prisma.classSchedule.findMany({
      where: whereClause, // Apply the conditional clubId filter
      include: {
        trainer: { select: { name: true } },
        location: true,
      },
      orderBy: { date: 'desc' },
      take: take,
    });

    res.json(schedules); // Return the array directly, no 'data' wrapper needed
  } catch (err) {
    console.error('Fetch schedule error:', err);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});


// ====================================================================================
// --- TRAINER-SPECIFIC SCHEDULE ROUTES ---
// These routes are prefixed with '/trainer' and target actions specific to the logged-in trainer.
// They all require authentication via authMiddleware.
// ====================================================================================

// GET /api/schedule/trainer/my - Fetch classes for the logged-in trainer
router.get('/trainer/my', authMiddleware, getTrainerSchedule);

// POST /api/schedule/trainer - Create a new class by the logged-in trainer
router.post('/trainer', authMiddleware, createClass);

// PATCH /api/schedule/trainer/:id - Update a class created by the logged-in trainer
router.patch('/trainer/:id', authMiddleware, updateClass);

// DELETE /api/schedule/trainer/:id - Cancel (mark as cancelled) a class created by the logged-in trainer
router.delete('/trainer/:id', authMiddleware, cancelClass);


// ====================================================================================
// --- FRANCHISE ADMIN-SPECIFIC SCHEDULE ROUTES ---
// These routes are prefixed with '/admin' and target actions specific to franchise admins.
// They allow admins to manage classes across their entire club.
// They all require authentication via authMiddleware.
// ====================================================================================

// GET /api/schedule/admin/club - Fetch all classes for the logged-in franchise admin's club
router.get('/admin/club', authMiddleware, getClassesByAdmin);

// POST /api/schedule/admin - Create a new class by the franchise admin (assigns trainer)
router.post('/admin', authMiddleware, createClassByAdmin);

// PATCH /api/schedule/admin/:id - Update any class within the franchise admin's club
router.patch('/admin/:id', authMiddleware, updateClassByAdmin);

// DELETE /api/schedule/admin/:id - Delete/Cancel any class within the franchise admin's club
router.delete('/admin/:id', authMiddleware, deleteClassByAdmin);


export default router;