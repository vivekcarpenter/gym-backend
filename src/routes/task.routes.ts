import express from 'express';
import { createTask, getTasksForClub, updateTaskStatus, deleteTask } from '../controllers/task.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware, getTasksForClub);
router.post('/', authMiddleware, createTask);
router.put('/:id', authMiddleware, updateTaskStatus);


// PUT /api/tasks/:id/complete - Mark task as complete (alternative endpoint)
router.put('/:id/complete', async (req, res) => {
  req.body.status = 'COMPLETED';
  return updateTaskStatus(req, res);
});

router.delete('/:id', authMiddleware, deleteTask);

export default router;
