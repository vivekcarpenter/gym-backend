// gym-api/src/types/express.d.ts
// Create this file if it doesn't exist.
// If it exists, ensure it has the Express namespace extension.

import { Request } from 'express';
import { Role } from '@prisma/client'; // Import your Role enum from Prisma client

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // This is the User.id
        email: string;
        role: Role;
        clubId?: string;
        profileType?: 'trainer' | 'member'; // 'trainer' if user is a trainer
        profileId?: string;                 // The Trainer.id if user is a trainer
        canCreateClasses?: boolean;         // Trainer.canCreateClasses
      };
    }
  }
}