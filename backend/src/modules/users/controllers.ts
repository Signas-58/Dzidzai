import { Request, Response } from 'express';
import { UserService } from './services';
import { logger } from '../../utils/logger';

export class UserController {
  static async createChild(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { name, gradeLevel, preferredLanguage } = req.body;

      // Validate required fields
      if (!name || gradeLevel === undefined || !preferredLanguage) {
        res.status(400).json({
          success: false,
          error: 'Name, gradeLevel, and preferredLanguage are required',
        });
        return;
      }

      const child = await UserService.createChild(req.user.id, {
        name,
        gradeLevel,
        preferredLanguage,
      });

      res.status(201).json({
        success: true,
        message: 'Child profile created successfully',
        data: child,
      });
    } catch (error) {
      logger.error('Create child error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to create child profile';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('authorized') ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  static async getChildren(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const children = await UserService.getChildren(req.user.id);

      res.status(200).json({
        success: true,
        data: children,
      });
    } catch (error) {
      logger.error('Get children error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to get children';
      const statusCode = message.includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  static async getChildById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Child ID is required',
        });
        return;
      }

      const child = await UserService.getChildById(id, req.user.id);

      res.status(200).json({
        success: true,
        data: child,
      });
    } catch (error) {
      logger.error('Get child error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to get child';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('authorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  static async updateChild(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;
      const { name, gradeLevel, preferredLanguage } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Child ID is required',
        });
        return;
      }

      if (!name && gradeLevel === undefined && !preferredLanguage) {
        res.status(400).json({
          success: false,
          error: 'At least one field (name, gradeLevel, or preferredLanguage) must be provided',
        });
        return;
      }

      const child = await UserService.updateChild(id, req.user.id, {
        name,
        gradeLevel,
        preferredLanguage,
      });

      res.status(200).json({
        success: true,
        message: 'Child profile updated successfully',
        data: child,
      });
    } catch (error) {
      logger.error('Update child error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to update child';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('authorized') ? 403 : 400;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  static async deleteChild(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Child ID is required',
        });
        return;
      }

      await UserService.deleteChild(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Child profile deleted successfully',
      });
    } catch (error) {
      logger.error('Delete child error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to delete child';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('authorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }

  static async getChildProgress(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Child ID is required',
        });
        return;
      }

      const progress = await UserService.getChildProgress(id, req.user.id);

      res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (error) {
      logger.error('Get child progress error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to get child progress';
      const statusCode = message.includes('not found') ? 404 : 
                        message.includes('authorized') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }
}
