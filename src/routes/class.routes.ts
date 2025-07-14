import express from 'express';
import { getClassesByFranchise } from '../controllers/class.controller';

const router = express.Router();

router.get('/by-franchise/:franchiseId', getClassesByFranchise);

export default router;
