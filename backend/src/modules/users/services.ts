import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface CreateChildData {
  name: string;
  gradeLevel: number;
  preferredLanguage: 'SHONA' | 'NDEBELE' | 'TONGA' | 'ENGLISH';
}

export interface UpdateChildData {
  name?: string;
  gradeLevel?: number;
  preferredLanguage?: 'SHONA' | 'NDEBELE' | 'TONGA' | 'ENGLISH';
}

export interface ChildResponse {
  id: string;
  name: string;
  gradeLevel: number;
  preferredLanguage: string;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  static async createChild(parentId: string, data: CreateChildData): Promise<ChildResponse> {
    const { name, gradeLevel, preferredLanguage } = data;

    // Validate grade level (0-8 for ECD A, ECD B, Grade 1-7)
    if (gradeLevel < 0 || gradeLevel > 8) {
      throw new Error('Grade level must be between 0 and 8 (0=ECD A, 1=ECD B, 2-8=Grade 1-7)');
    }

    // Validate name
    if (!name || name.trim().length < 2) {
      throw new Error('Child name must be at least 2 characters long');
    }

    // Verify parent exists
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, role: true, isActive: true },
    });

    if (!parent || !parent.isActive) {
      throw new Error('Parent not found or inactive');
    }

    if (parent.role !== 'PARENT' && parent.role !== 'ADMIN') {
      throw new Error('Only parents can create child profiles');
    }

    // Create child
    const child = await prisma.child.create({
      data: {
        name: name.trim(),
        gradeLevel,
        preferredLanguage,
        parentId,
      },
    });

    logger.info(`Child profile created: ${child.id} for parent: ${parentId}`);

    return {
      id: child.id,
      name: child.name,
      gradeLevel: child.gradeLevel,
      preferredLanguage: child.preferredLanguage,
      parentId: child.parentId,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    };
  }

  static async getChildren(parentId: string): Promise<ChildResponse[]> {
    // Verify parent exists
    const parent = await prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, role: true, isActive: true },
    });

    if (!parent || !parent.isActive) {
      throw new Error('Parent not found or inactive');
    }

    // Get children
    const children = await prisma.child.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
    });

    return children.map((child) => ({
      id: child.id,
      name: child.name,
      gradeLevel: child.gradeLevel,
      preferredLanguage: child.preferredLanguage,
      parentId: child.parentId,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    }));
  }

  static async getChildById(childId: string, requestingUserId: string): Promise<ChildResponse> {
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: {
          select: { id: true, role: true, isActive: true },
        },
      },
    });

    if (!child) {
      throw new Error('Child not found');
    }

    // Check authorization: parent can only access their own children, admin can access all
    const isParent = child.parent.id === requestingUserId;
    const isAdmin = child.parent.role === 'ADMIN' && requestingUserId === child.parent.id;

    if (!isParent && !isAdmin) {
      throw new Error('Not authorized to access this child profile');
    }

    if (!child.parent.isActive) {
      throw new Error('Parent account is inactive');
    }

    return {
      id: child.id,
      name: child.name,
      gradeLevel: child.gradeLevel,
      preferredLanguage: child.preferredLanguage,
      parentId: child.parentId,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    };
  }

  static async updateChild(
    childId: string,
    requestingUserId: string,
    data: UpdateChildData
  ): Promise<ChildResponse> {
    // Get child with parent info
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: {
          select: { id: true, role: true, isActive: true },
        },
      },
    });

    if (!child) {
      throw new Error('Child not found');
    }

    // Check authorization
    const isParent = child.parent.id === requestingUserId;
    const isAdmin = child.parent.role === 'ADMIN' && requestingUserId === child.parent.id;

    if (!isParent && !isAdmin) {
      throw new Error('Not authorized to update this child profile');
    }

    if (!child.parent.isActive) {
      throw new Error('Parent account is inactive');
    }

    // Validate grade level if provided
    if (data.gradeLevel !== undefined && (data.gradeLevel < 0 || data.gradeLevel > 8)) {
      throw new Error('Grade level must be between 0 and 8 (0=ECD A, 1=ECD B, 2-8=Grade 1-7)');
    }

    // Validate name if provided
    if (data.name !== undefined && data.name.trim().length < 2) {
      throw new Error('Child name must be at least 2 characters long');
    }

    // Update child
    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.gradeLevel !== undefined && { gradeLevel: data.gradeLevel }),
        ...(data.preferredLanguage && { preferredLanguage: data.preferredLanguage }),
      },
    });

    logger.info(`Child profile updated: ${childId}`);

    return {
      id: updatedChild.id,
      name: updatedChild.name,
      gradeLevel: updatedChild.gradeLevel,
      preferredLanguage: updatedChild.preferredLanguage,
      parentId: updatedChild.parentId,
      createdAt: updatedChild.createdAt,
      updatedAt: updatedChild.updatedAt,
    };
  }

  static async deleteChild(childId: string, requestingUserId: string): Promise<void> {
    // Get child with parent info
    const child = await prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: {
          select: { id: true, role: true, isActive: true },
        },
      },
    });

    if (!child) {
      throw new Error('Child not found');
    }

    // Check authorization
    const isParent = child.parent.id === requestingUserId;
    const isAdmin = child.parent.role === 'ADMIN' && requestingUserId === child.parent.id;

    if (!isParent && !isAdmin) {
      throw new Error('Not authorized to delete this child profile');
    }

    if (!child.parent.isActive) {
      throw new Error('Parent account is inactive');
    }

    // Delete child (cascade delete will handle related progress)
    await prisma.child.delete({
      where: { id: childId },
    });

    logger.info(`Child profile deleted: ${childId}`);
  }

  static async getChildProgress(childId: string, requestingUserId: string): Promise<any> {
    // Verify child belongs to requesting user
    await this.getChildById(childId, requestingUserId);

    // Get progress data
    const progress = await prisma.userProgress.findMany({
      where: { userId: childId },
      orderBy: { createdAt: 'desc' },
    });

    return progress;
  }
}
