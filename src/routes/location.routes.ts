import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getLocationsByClub } from '../controllers/location.controller';

const router = Router();
router.get('/', authMiddleware, getLocationsByClub); // GET /api/locations

export default router;