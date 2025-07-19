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
    // --- END 

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenPayload: Record<string, any> = {
      id: user.id,
      email: user.email, // Include email in token for convenience
      role: user.role,
      clubId: user.clubId,
    };

    // Conditionally add profile-specific IDs and permissions
    if (user.role === 'trainer' && user.trainerProfile) {
      tokenPayload.profileType = 'trainer'; // Indicate which profile type this ID belongs to
      tokenPayload.profileId = user.trainerProfile.id;
      tokenPayload.canCreateClasses = user.trainerProfile.canCreateClasses;
    } 
    else if (user.role === 'member' && user.memberProfile) {
      tokenPayload.profileType = 'member'; // Indicate which profile type this ID belongs to
      tokenPayload.profileId = user.memberProfile.id;
    }

    console.log('Login Controller Debug: Final tokenPayload before signing:', tokenPayload);

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      user: tokenPayload, // Send the same enriched payload back to the frontend
      token,
    });
  } catch (err) {
    console.error(err);
    console.error('Login Controller Error:', err); 
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setupPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  try {
    // 1. Verify the token
    const decodedToken = verifyPasswordSetupToken(token);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid or expired password setup token.' });
    }

    // 2. Find the user
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Ensure the email in the token matches the user's email
    if (user.email !== decodedToken.email) {
        return res.status(403).json({ error: 'Token mismatch.' });
    }

    // 3. Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // 4. Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password set successfully. You can now log in.' });

  } catch (error) {
    console.error('Error setting up password:', error);
    res.status(500).json({ error: 'Failed to set password.' });
  }
};
