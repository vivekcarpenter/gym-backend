// src/routes/staff.routes.ts (Extend this file or create a new one)
import express from 'express';
import { inviteStaff } from '../controllers/staff.controller'; // Import the new inviteStaff controller
import { getAllStaffForFranchise } from '../controllers/staff.controller'; // Assuming you have this
import { authMiddleware } from '../middlewares/authMiddleware'; // Your authentication middleware
import { authorize } from '../middlewares/permission'; // Your authorization middleware

const router = express.Router();

// Route to invite new staff members
router.post(
  '/invite',
  authMiddleware,
  authorize(['franchise_admin']), // Only franchise_admin can invite staff
  inviteStaff
);

// Route to get all staff for a franchise
router.get(
  '/',
  authMiddleware,
  authorize(['franchise_admin']), // Only franchise_admin can view staff
  getAllStaffForFranchise // This controller needs to filter by clubId and roles
);

export default router;