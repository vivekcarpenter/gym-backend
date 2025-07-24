// src/types/request.types.ts
import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
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
