// src/controllers/staff.controller.ts
import { Request, Response } from 'express';
import { PrismaClient, Role, UserStatus } from '@prisma/client'; // Make sure UserStatus is imported
import { generatePasswordSetupToken } from '../utils/authUtils';
import { sendPasswordSetupEmail } from '../services/email.service';
import { AuthenticatedRequest } from '../types/request.types';

const prisma = new PrismaClient();

// Interface to extend Express Request with user data from auth middleware
// interface AuthenticatedRequest extends Request {
//   user?: {
//     id: string;
//     email: string;
//     role: Role;
//     clubId?: string;
//   };
// }

export const inviteStaff = async (req: AuthenticatedRequest, res: Response) => {
  const inviterClubId = req.user?.clubId;
  const inviterRole = req.user?.role;

  const { name, email, phone, role, clubId } = req.body;

  if (!name || !email || !role || !clubId) {
    return res.status(400).json({ error: 'Name, email, role, and club ID are required.' });
  }

  if (inviterRole !== Role.super_admin && (inviterRole !== Role.franchise_admin || inviterClubId !== clubId)) {
    return res.status(403).json({ error: 'Access denied. You are not authorized to invite staff to this club.' });
  }

  const allowedStaffRoles: Role[] = [Role.staff, Role.trainer];
  if (!allowedStaffRoles.includes(role as Role)) {
      return res.status(400).json({ error: `Invalid role specified. Only ${allowedStaffRoles.join(', ')} roles can be invited.` });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (existingUser.status === UserStatus.ACTIVE) {
        return res.status(409).json({ error: 'A user with this email already exists and is active.' });
      }
      return res.status(409).json({ error: 'A user with this email already exists and is awaiting password setup.' });
    }

    console.log('Invite Staff Debug: Creating user with email:', email);

    // STEP 1: Create the user with initial null password and PENDING status
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role: role as Role,
        club: { connect: { id: clubId } },
        password: null,
        status: UserStatus.PENDING,
      },
    });

    console.log('Invite Staff Debug: Created user with ID:', newUser.id);
    console.log('Invite Staff Debug: newUser.id type:', typeof newUser.id);
    console.log('Invite Staff Debug: newUser object keys:', Object.keys(newUser));

    // Verify the user ID is valid before generating token
    if (!newUser.id) {
      throw new Error('User creation failed: No ID returned');
    }

    // STEP 2: Now that newUser has an ID, generate the token with the ACTUAL user ID
    console.log('Invite Staff Debug: About to generate token with userId:', newUser.id);
    const setupToken = generatePasswordSetupToken(newUser.id, newUser.email);
    const setupExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    console.log('Invite Staff Debug: Generated setup token for user:', newUser.id);
    console.log('Invite Staff Debug: Setup token length:', setupToken.length);

    // STEP 3: Update the newly created user with the generated token and expiry
    const userWithToken = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        setupPasswordToken: setupToken,
        setupPasswordExpires: setupExpires,
      },
    });

    console.log('Invite Staff Debug: Updated user with token');

    // STEP 4: Send the email using the token stored on the userWithToken object
    await sendPasswordSetupEmail(userWithToken.email, userWithToken.name || 'Staff Member', userWithToken.setupPasswordToken!);

    console.log('Invite Staff Debug: Email sent successfully');

    res.status(201).json({
      message: 'Staff invite sent successfully. An email has been dispatched for password setup.',
      staffId: userWithToken.id,
      email: userWithToken.email,
      role: userWithToken.role,
    });

  } catch (error: any) {
    console.error('Error inviting staff:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }
    res.status(500).json({ error: 'An unexpected error occurred while inviting staff.' });
  }
};

export const getAllStaffForFranchise = async (req: AuthenticatedRequest, res: Response) => {
  const { clubId } = req.query;
  const userClubId = req.user?.clubId;
  const userRole = req.user?.role;

  try {
    if (userRole !== Role.super_admin && (userRole !== Role.franchise_admin || userClubId !== clubId)) {
      return res.status(403).json({ error: 'Access denied. Unauthorized to view staff for this club.' });
    }

    if (!clubId) {
      return res.status(400).json({ error: 'Club ID is required to fetch staff.' });
    }

    const staffRolesToList: Role[] = [Role.staff];

    const staffMembers = await prisma.user.findMany({
      where: {
        clubId: String(clubId),
        role: {
          in: staffRolesToList
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.status(200).json(staffMembers);
  } catch (error: any) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff members.' });
  }
};