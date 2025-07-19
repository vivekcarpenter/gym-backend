// src/utils/authUtils.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use a strong secret!

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generates a secure random token for password reset
export const generatePasswordResetToken = (): { token: string; hashedToken: string; expires: Date } => {
  const token = crypto.randomBytes(32).toString('hex'); // Generate a random token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex'); // Hash it for DB storage

  const expires = new Date(Date.now() + 3600000); // Token valid for 1 hour

  return { token, hashedToken, expires };
};

// Generates a JWT for the password setup link
export const generatePasswordSetupToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email, type: 'password_setup' }, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
};

// Verifies the password setup JWT
export const verifyPasswordSetupToken = (token: string): { userId: string; email: string; type: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; type: string; iat: number; exp: number };
    if (decoded.type !== 'password_setup') {
      return null; // Ensure it's the correct type of token
    }
    return decoded;
  } catch (error) {
    console.error("Error verifying password setup token:", error);
    return null;
  }
};

// You might also need a `generateRandomPassword` function if you go the temporary password route
export const generateRandomPassword = (length = 12): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};