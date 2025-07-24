// src/types/express.d.ts
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        clubId?: string;
        profileType?: 'trainer' | 'member';
        profileId?: string;
        canCreateClasses?: boolean;
      };
    }
  }
}

export {};
