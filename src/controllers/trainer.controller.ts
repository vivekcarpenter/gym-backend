// src/controllers/trainer.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, generatePasswordSetupToken } from '../utils/authUtils'; // Import auth utilities
import { sendPasswordSetupEmail } from '../services/email.service'; 


const prisma = new PrismaClient();


interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    clubId?: string;
    role: string;
  };
}

export const getTrainersByFranchise = async (req: AuthenticatedRequest, res: Response) => {
  const { franchiseId } = req.params; // This is the clubId
  const userClubId = req.user?.clubId;
  const userRole = req.user?.role;

  // Ensure the requesting user is an admin for that club, or a super_admin
  if (!userClubId || (userRole !== 'super_admin' && userClubId !== franchiseId)) {
    return res.status(403).json({ error: 'Access denied. Not authorized for this club.' });
  }

  try {
    const trainers = await prisma.trainer.findMany({
      where: { clubId: franchiseId },
      select: { id: true, name: true }, // Only need ID and name for dropdown
      orderBy: { name: 'asc' }
    });
    res.json(trainers);
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ error: 'Failed to fetch trainers.' });
  }
};


// export const createTrainer = async (req: Request, res: Response) => {
//   const { name, email, phone, specialization, clubId } = req.body;

//   // Basic validation
//   if (!name || !email || !clubId) {
//     return res.status(400).json({ error: 'Name, email, and clubId are required.' });
//   }

//   try {
//     const newTrainer = await prisma.trainer.create({
//       data: {
//         name,
//         email,
//         phone, // Optional, so no strong validation here
//         specialization, // Optional
//         club: {
//           connect: { id: clubId }, // Connect the trainer to the specified club
//         },
//       },
//     });
//     res.status(201).json(newTrainer); // 201 Created status
//   } catch (error) {
//     console.error('Error creating trainer:', error);
//     // Handle specific Prisma errors, e.g., unique constraint violation for email
//     if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
//       return res.status(409).json({ error: 'A trainer with this email already exists.' });
//     }
//     res.status(500).json({ error: 'Failed to create trainer.' });
//   }
// };

export const createTrainer = async (req: Request, res: Response) => {
  const { name, email, phone, specialization, clubId } = req.body;

  // Basic validation
  if (!name || !email || !clubId) {
    return res.status(400).json({ error: 'Name, email, and clubId are required.' });
  }

  try {
    // --- START: Corrected Prisma Transaction for linking User and Trainer ---
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the User record first
      const user = await tx.user.create({
        data: {
          email,
          // Assign a temporary dummy password. It will be overwritten by the setup link.
          // Ensure your User.password field is not nullable, or handle null passwords if it is.
          password: await hashPassword('temp-password-123!@#'), // Hash a temporary password
          role: 'trainer', // Assign the 'trainer' role
          club: { connect: { id: clubId } },
          name: name, // Associate the user name
        },
      });

      // 2. Now, create the Trainer record and link it to the newly created User
      const trainer = await tx.trainer.create({
        data: {
          name,
          email,
          phone,
          specialization,
          club: { connect: { id: clubId } },
          
          user: { connect: { id: user.id } } // Explicitly connect the user relation
        },
      });

      return { user, trainer }; // Return both created records
    });
    // --- END: Corrected Prisma Transaction ---

    const { user, trainer } = result; // Destructure the results from the transaction

    // 3. Generate a password setup token and send email
    const passwordSetupToken = generatePasswordSetupToken(user.id, user.email);
    await sendPasswordSetupEmail(user.email, user.name || 'Trainer', passwordSetupToken);

    res.status(201).json({
      message: 'Trainer created successfully. An email has been sent to set their password.',
      trainer: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        specialization: trainer.specialization,
      },
      userId: user.id // Return the user ID for reference
    });

  } catch (error: any) { // Catch as 'any' for broader error handling
    console.error('Error creating trainer and user:', error);
    // Handle specific Prisma errors, e.g., unique constraint violation for email
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      // If trainer or user email already exists, it will throw this error
      return res.status(409).json({ error: 'A trainer or user with this email already exists.' });
    }
    res.status(500).json({ error: 'Failed to create trainer and user.' });
  }
};