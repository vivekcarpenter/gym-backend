// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { verifyPasswordSetupToken, hashPassword } from '../utils/authUtils';

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
       include: {
        trainerProfile: true,
        memberProfile: true,
  }
    });

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    console.log('Login Controller Debug: User found:', user.email, 'with role:', user.role);
    console.log('Login Controller Debug: Has trainerProfile:', !!user.trainerProfile);
    if (user.trainerProfile) {
        console.log('Login Controller Debug: trainerProfile ID:', user.trainerProfile.id);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenPayload: Record<string, any> = {
      id: user.id,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
    };

    // Conditionally add profile-specific IDs and permissions
    // if (user.role === 'trainer' && user.trainerProfile) {
    //   tokenPayload.profileType = 'trainer';
    //   tokenPayload.profileId = user.trainerProfile.id;
    //   tokenPayload.canCreateClasses = user.trainerProfile.canCreateClasses;
    // } 
    // else if (user.role === 'member' && user.memberProfile) {
    //   tokenPayload.profileType = 'member';
    //   tokenPayload.profileId = user.memberProfile.id;
    // }


    // Block login ONLY if trainer/member profile is missing
if (
  (user.role === 'trainer' && !user.trainerProfile) ||
  (user.role === 'member' && !user.memberProfile)
) {
  return res.status(403).json({ error: 'Profile not configured for this role yet.' });
}

// Add optional profile data to tokenPayload
if (user.role === 'trainer') {
  tokenPayload.profileType = 'trainer';
  tokenPayload.profileId = user.trainerProfile?.id || null;
  tokenPayload.canCreateClasses = user.trainerProfile?.canCreateClasses || false;
} else if (user.role === 'member') {
  tokenPayload.profileType = 'member';
  tokenPayload.profileId = user.memberProfile?.id || null;
}

    console.log('Login Controller Debug: Final tokenPayload before signing:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      user: tokenPayload,
      token,
    });
  } catch (err) {
    console.error('Login Controller Error:', err); 
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setupPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  // Add debug logging
  console.log('Setup Password Debug: Received request');
  console.log('Setup Password Debug: Token present:', !!token);
  console.log('Setup Password Debug: Token length:', token?.length);
  console.log('Setup Password Debug: New password present:', !!newPassword);

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  try {
    // First, let's see if we can find a user by this exact token in the database
    console.log('Setup Password Debug: Searching for user with this setup token...');
    const userWithToken = await prisma.user.findFirst({
      where: { setupPasswordToken: token }
    });
    
    if (userWithToken) {
      console.log('Setup Password Debug: Found user with matching token:', userWithToken.id);
      console.log('Setup Password Debug: Token expiry:', userWithToken.setupPasswordExpires);
    } else {
      console.log('Setup Password Debug: No user found with this exact token in database');
    }

    // 1. Verify the token
    console.log('Setup Password Debug: Attempting to verify JWT token...');
    const decodedToken = verifyPasswordSetupToken(token);

    console.log('Setup Password Debug: Token verification result:', decodedToken);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid or expired password setup token.' });
    }

    // Add validation for userId
    if (!decodedToken.userId) {
      console.error('Setup Password Error: Token does not contain userId');
      return res.status(401).json({ error: 'Invalid token: missing user ID.' });
    }

    console.log('Setup Password Debug: Looking for user with ID:', decodedToken.userId);

    // 2. Find the user
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
    });

    console.log('Setup Password Debug: User found by ID:', !!user);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Ensure the email in the token matches the user's email
    if (user.email !== decodedToken.email) {
        console.error('Setup Password Error: Email mismatch. Token email:', decodedToken.email, 'User email:', user.email);
        return res.status(403).json({ error: 'Token mismatch.' });
    }

    // Check if the token in the database matches (additional security)
    if (user.setupPasswordToken !== token) {
        console.error('Setup Password Error: Database token mismatch');
        return res.status(401).json({ error: 'Invalid token.' });
    }

    // Check if token has expired
    if (user.setupPasswordExpires && user.setupPasswordExpires < new Date()) {
        console.error('Setup Password Error: Token has expired');
        return res.status(401).json({ error: 'Token has expired.' });
    }

    // Check if user is still in PENDING status (optional but good practice)
    if (user.status !== 'PENDING') {
        console.log('Setup Password Warning: User status is not PENDING, current status:', user.status);
    }

    // 3. Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // 4. Update the user's password and status
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        status: 'ACTIVE', // Set status to ACTIVE after password is set
        setupPasswordToken: null, // Clear the setup token
        setupPasswordExpires: null, // Clear the expiry
      },
    });

    console.log('Setup Password Success: Password updated for user:', user.email);

    res.status(200).json({ message: 'Password set successfully. You can now log in.' });

  } catch (error) {
    console.error('Setup Password Error:', error);
    res.status(500).json({ error: 'Failed to set password.' });
  }
};