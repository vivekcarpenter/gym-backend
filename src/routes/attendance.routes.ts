//// File: src/routes/attendance.routes.ts
import express from 'express';
import {
  getAttendanceForSchedule,
  markAttendance,
} from '../controllers/attendance.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

              


router.get('/schedule/:scheduleId', authMiddleware, getAttendanceForSchedule); // Get attendance for a specific class
router.post('/', authMiddleware, markAttendance); // Mark attendance (bulk)
export default router;
