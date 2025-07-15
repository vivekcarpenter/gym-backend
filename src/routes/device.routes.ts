import express from 'express';
import { getDevicesByClub } from '../controllers/device.controller';

const router = express.Router();

router.get('/', getDevicesByClub);

export default router;
