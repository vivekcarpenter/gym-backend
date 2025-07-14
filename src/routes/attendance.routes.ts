//// File: src/routes/attendance.routes.ts
import express from 'express';
import {
  getAttendanceByFilters,
  markAttendance,
} from '../controllers/attendance.controller';

const router = express.Router();

router.get('/', getAttendanceByFilters);         // ?date=&classId=&trainerId=
router.post('/', markAttendance);                // Bulk attendance

export default router;
