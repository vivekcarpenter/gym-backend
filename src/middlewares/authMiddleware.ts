// gym-api/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client'; // Assuming Role enum is accessible from Prisma client

// Define the JWT payload interface to match what you put in the token
interface JwtPayload {
  id: string; // User.id
  email: string;
  role: Role; // THIS IS THE KEY!
  clubId?: string;
  profileType?: 'trainer' | 'member';
  profileId?: string; // Trainer.id or Member.id
  canCreateClasses?: boolean; // Trainer.canCreateClasses
  exp: number; // Expiration time (standard JWT field)
  iat: number; // Issued at time (standard JWT field)
}

// Extend the Request object to include user
// IMPORTANT: This declaration needs to be in a global type definition file
// like `src/@types/express.d.ts` or directly above the middleware
// to properly augment the Express Request interface across your project.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Now directly use JwtPayload as the type for req.user
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // --- ADD THIS LOG ---
  console.log('Auth Middleware: Processing request...');
  // --- END LOG ---

  // 1. Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth Middleware: No Bearer token provided or malformed header.'); // ADD LOG
    return res.status(401).json({ error: 'No token provided, authorization denied.' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token (e.g., "Bearer YOUR_TOKEN")
  // --- ADD THIS LOG (be cautious with logging tokens in production) ---
  console.log('Auth Middleware: Extracted token (first 10 chars):', token.substring(0, 10) + '...');
  // --- END LOG ---

  try {
    // 2. Verify the token using your JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // --- ADD THIS LOG ---
    console.log('Auth Middleware: Decoded JWT payload:', decoded); // This shows what `jwt.verify` returns
    // --- END LOG ---

    // 3. Attach user information from the decoded token to the request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      clubId: decoded.clubId,
      profileType: decoded.profileType,
      profileId: decoded.profileId,
      canCreateClasses: decoded.canCreateClasses,
      exp: decoded.exp,
      iat: decoded.iat,
    };

    // --- ADD THIS LOG ---
    console.log('Auth Middleware: req.user attached to request:', req.user); // This shows what's put on req.user
    // --- END LOG ---

    // 4. Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error('Auth Middleware: Token verification failed. Error details:', err); // Log full error
    // If token is invalid or expired, send 403 Forbidden
    return res.status(403).json({ error: 'Token is not valid or expired.' });
  }
};