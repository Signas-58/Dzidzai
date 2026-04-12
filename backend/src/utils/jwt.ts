import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

const jwtSecret: jwt.Secret = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
})();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRE || '15m';
  private static readonly REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRE || '7d';

  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(
      payload as object,
      jwtSecret as jwt.Secret,
      { expiresIn: this.ACCESS_TOKEN_EXPIRES } as jwt.SignOptions
    );
  }

  static generateRefreshToken(): string {
    return jwt.sign(
      { type: 'refresh' } as object,
      jwtSecret as jwt.Secret,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES } as jwt.SignOptions
    );
  }

  static async generateTokenPair(user: { id: string; email: string; role: string }): Promise<TokenPair> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      return decoded;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token: string): { type: string } {
    try {
      const decoded = jwt.verify(token, jwtSecret) as { type: string };
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token type');
      }
      return decoded;
    } catch (error) {
      logger.error('Refresh token verification failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  static async validateRefreshToken(refreshToken: string): Promise<{ userId: string; email: string; role: string } | null> {
    try {
      // Verify token format
      this.verifyRefreshToken(refreshToken);

      // Check if token exists in database and is not expired
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        // Clean up expired session
        if (session) {
          await prisma.session.delete({ where: { id: session.id } });
        }
        return null;
      }

      return {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      };
    } catch (error) {
      logger.error('Refresh token validation failed:', error);
      return null;
    }
  }

  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { refreshToken },
      });
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      // Don't throw error - token might not exist
    }
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { userId },
      });
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      throw new Error('Failed to revoke user tokens');
    }
  }

  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
      
      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired tokens`);
      }
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
    }
  }
}
