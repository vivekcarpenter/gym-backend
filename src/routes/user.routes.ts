// src/routes/user.routes.ts
import express from 'express';
import { getUsersByRole, assignClubToUser } from '../controllers/user.controller';

const router = express.Router();

router.get('/', getUsersByRole); // GET /api/users?role=franchise_admin
router.put('/:id/assign-club', assignClubToUser); // PUT /api/users/:id/assign-club

export default router;
