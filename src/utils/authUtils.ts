// src/utils/authUtils.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Generates a secure random token for password reset
export const generatePasswordResetToken = (): { token: string; hashedToken: string; expires: Date } => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 3600000); // Token valid for 1 hour
  return { token, hashedToken, expires };
};

// Generates a JWT for the password setup link
export const generatePasswordSetupToken = (userId: string, email: string): string => {
  console.log('Generate Token Debug: Creating token for userId:', userId, 'email:', email);
  console.log('Generate Token Debug: userId type:', typeof userId, 'userId value:', userId);
  
  if (!userId || userId === 'null' || userId === 'undefined') {
    console.error('Generate Token Error: Invalid userId provided:', userId);
    throw new Error('User ID is required to generate password setup token');
  }
  
  const payload = { 
    userId: userId.toString(), // Ensure it's a string
    email, 
    type: 'password_setup' 
  };
  
  console.log('Generate Token Debug: Token payload:', payload);
  console.log('Generate Token Debug: JWT_SECRET exists:', !!JWT_SECRET);
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  
  console.log('Generate Token Debug: Token created successfully, length:', token.length);
  console.log('Generate Token Debug: Token first 50 chars:', token.substring(0, 50));
  
  return token;
};

// Verifies the password setup JWT
export const verifyPasswordSetupToken = (token: string): { userId: string; email: string; type: string } | null => {
  try {
    console.log('Verify Token Debug: Attempting to verify token...');
    console.log('Verify Token Debug: Token length:', token.length);
    console.log('Verify Token Debug: Token first 50 chars:', token.substring(0, 50));
    console.log('Verify Token Debug: JWT_SECRET exists:', !!JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    console.log('Verify Token Debug: Raw decoded token:', decoded);
    console.log('Verify Token Debug: Decoded keys:', Object.keys(decoded));
    
    // Check all possible variations of userId field
    const userId = decoded.userId || decoded.id || decoded.user_id;
    
    console.log('Verify Token Debug: Extracted userId:', userId);
    console.log('Verify Token Debug: userId type:', typeof userId);
    
    if (decoded.type !== 'password_setup') {
      console.error('Verify Token Error: Invalid token type:', decoded.type);
      return null;
    }
    
    if (!userId) {
      console.error('Verify Token Error: Token missing userId');
      console.error('Verify Token Error: Full decoded object:', JSON.stringify(decoded, null, 2));
      return null;
    }
    
    const result = {
      userId: userId.toString(),
      email: decoded.email,
      type: decoded.type
    };
    
    console.log('Verify Token Debug: Returning result:', result);
    
    return result;
  } catch (error) {
    console.error("Verify Token Error: Error verifying password setup token:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.error("Verify Token Error: JWT Error details:", error.message);
    }
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