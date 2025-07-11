import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const memberSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  gender: z.string(),
  memberType: z.enum(['member', 'prospect']),
  club: z.string(),

  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    search: z.string().optional(),
  }),

  marketing: z.object({
    salesRep: z.string().optional(),
    sourcePromotion: z.string().optional(),
    referredBy: z.string().optional(),
  }),

  additional: z.object({
    trainer: z.string().optional(),
    joiningDate: z.string().optional(),
    occupation: z.string().optional(),
    organization: z.string().optional(),
    involvementType: z.string().optional(),
  }),

  emergency: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
  }),

  medicalInfo: z.string().optional(),
  phone: z.string().optional(),
  work: z.string().optional(),
  avatarUrl: z.string().optional(),
  keyFob: z.string().optional(),
  tags: z.string().optional(),
  note: z.string().optional(),
});

export const validateMember = (req: Request, res: Response, next: NextFunction) => {
  try {
    memberSchema.parse(req.body);
    next();
  } catch (err: any) {
    res.status(400).json({ 
        error: 'Validation failed',
  details: err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  })),
    });
  }
};
