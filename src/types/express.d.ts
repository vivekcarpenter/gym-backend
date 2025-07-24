// src/types/express.d.ts
import { Role } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
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
