import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import path from 'path';

export const getTrainingResources = async (_req: Request, res: Response) => {
  try {
    const resources = await prisma.trainingResource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(resources);
  } catch (err) {
    console.error('Get training error:', err);
    res.status(500).json({ error: 'Failed to fetch training materials' });
  }
};

export const createTrainingResource = async (req: Request, res: Response) => {
  const { title, description, type, videoUrl, fileUrl, tags, roles } = req.body;

  try {
    const created = await prisma.trainingResource.create({
      data: {
        title,
        description,
        type,
        videoUrl,
        fileUrl,
        tags,
        roles,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Create training error:', err);
    res.status(500).json({ error: 'Failed to create training resource' });
  }
};

export const uploadTrainingFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // In production → upload to Supabase/S3 and return public URL
    const url = `/uploads/${file.filename}`;

    res.json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
};

export const getTrainersByFranchise = async (req: Request, res: Response) => {
  const { franchiseId } = req.params;

  try {
    const trainers = await prisma.trainer.findMany({
      where: {
        clubId: franchiseId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,        
        specialization: true 
      },
    });

    res.json(trainers);
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ error: 'Error fetching trainers' });
  }
};
