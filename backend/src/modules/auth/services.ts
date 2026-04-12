import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../../utils/password';
import { JWTService, TokenPair } from '../../utils/jwt';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'PARENT' | 'ADMIN';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: TokenPair;
}

export class AuthService {
  static async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role = 'PARENT' } = data;

    if (role !== 'PARENT' && role !== 'ADMIN') {
      throw new Error('Invalid role. Allowed roles: PARENT, ADMIN');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = PasswordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user.isActive) {
      throw new Error('Account is not active');
    }

    // Generate tokens
    const tokens = await JWTService.generateTokenPair(user);

    logger.info(`User registered successfully: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  static async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is not active');
    }

    // Verify password
    const isPasswordValid = await PasswordService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = await JWTService.generateTokenPair(user);

    logger.info(`User logged in successfully: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }

  static async refresh(refreshToken: string): Promise<TokenPair> {
    // Validate refresh token
    const tokenData = await JWTService.validateRefreshToken(refreshToken);
    
    if (!tokenData) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Revoke old refresh token
    await JWTService.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const newTokens = await JWTService.generateTokenPair(user);

    logger.info(`Token refreshed for user: ${user.email}`);

    return newTokens;
  }

  static async logout(refreshToken: string): Promise<void> {
    await JWTService.revokeRefreshToken(refreshToken);
    logger.info('User logged out successfully');
  }

  static async logoutAll(userId: string): Promise<void> {
    await JWTService.revokeAllUserTokens(userId);
    logger.info(`All sessions revoked for user: ${userId}`);
  }

  static async getProfile(userId: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: Date;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Verify current password
    const isCurrentPasswordValid = await PasswordService.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password requirements not met: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedNewPassword = await PasswordService.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Revoke all tokens (force re-login on all devices)
    await JWTService.revokeAllUserTokens(userId);

    logger.info(`Password changed for user: ${userId}`);
  }
}
