import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, assignedTo, clubId, assignedBy } = req.body;

    // Validate required fields
   if (
  !title ||
  typeof assignedTo !== 'string' ||
  typeof clubId !== 'string' ||
  typeof assignedBy !== 'string'
) {
  return res.status(400).json({
    error: 'Missing or invalid required fields: title, assignedTo, clubId, assignedBy',
  });
}


    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        assignedTo,
        assignedBy,
        clubId,
        status: 'PENDING' // Set default status
      }
    });

    res.status(201).json(task);
  } catch (err) {
    console.error('Task creation error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};
// export const getTasksForClub = async (req: Request, res: Response) => {
//   const { clubId, userId } = req.query;

//   try {
//     const tasks = await prisma.task.findMany({
//       where: {
//         clubId: String(clubId),
//         ...(userId ? { assignedTo: String(userId) } : {}),
//       },
//       orderBy: { dueDate: 'asc' }
//     });

//     res.json(tasks);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch tasks' });
//   }
// };

export const getTasksForClub = async (req: Request, res: Response) => {
  const { clubId, userId } = req.query;

  try {
    const whereClause: any = {};
    
    if (clubId) {
      whereClause.clubId = String(clubId);
    }
    
    if (userId) {
      whereClause.assignedTo = String(userId); // This filters tasks for specific user
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        staff: {
          select: { name: true, email: true }
        },
        assignedByUser: {
          select: { name: true, email: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await prisma.task.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.task.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
