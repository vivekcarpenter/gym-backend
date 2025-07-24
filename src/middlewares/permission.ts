// // src/middlewares/permission.ts
// import { Request, Response, NextFunction } from 'express';
// import { Role } from '@prisma/client'; // Import the Role enum from Prisma client

// // Interface to ensure `req.user` is defined by authMiddleware
// interface AuthenticatedRequest extends Request {
//   user?: {
//     id: string;
//     email: string;
//     role: Role; // Explicitly use the imported Role enum
//     clubId?: string;
//     // ... other properties you attach to req.user
//   };
// }

// /**
//  * Authorization middleware to check if the authenticated user's role
//  * is among the allowed roles for a given route.
//  *
//  * @param allowedRoles An array of roles that are permitted to access the route.
//  */
// export const authorize = (allowedRoles: Role[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     // 1. Ensure user is authenticated (authMiddleware should run before this)
//     if (!req.user) {
//       // This should ideally not happen if authMiddleware runs first
//       return res.status(401).json({ error: 'Authentication required.' });
//     }

//     const userRole = req.user.role;

//     // 2. Check if the user's role is in the list of allowed roles
//     if (allowedRoles.includes(userRole)) {
//       // User has the necessary permission, proceed to the next middleware/route handler
//       next();
//     } else {
//       // User does not have the required permission
//       console.warn(`Access denied: User with role '${userRole}' attempted to access a restricted resource.`);
//       return res.status(403).json({ error: 'Access denied. You do not have permission to perform this action.' });
//     }
//   };
// };


// src/middlewares/permission.ts
import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../types/request.types';


// Interface to ensure `req.user` is defined by authMiddleware
// export interface AuthenticatedRequest extends Request {
//   user?: {
//     id: string;
//     email: string;
//     role: Role;
//     clubId?: string;
//   };
// }

export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      console.warn(
        `Access denied: User with role '${userRole}' attempted to access a restricted resource.`
      );
      return res.status(403).json({ error: 'Access denied. You do not have permission to perform this action.' });
    }
  };
};
