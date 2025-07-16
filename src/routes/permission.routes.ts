import express from 'express';
import {
  getAllPermissions,
  updatePermission,
} from '../controllers/permission.controller';

const router = express.Router();

router.get('/', getAllPermissions);           // ?role=trainer
router.put('/:id', updatePermission);         // Update `allowed` status

export default router;
