import { Router } from 'express';
import { UserController } from './controllers';
import { authenticate, requireParent } from '../../middleware/auth';

const router = Router();

// User profile routes (moved to auth module for better organization)
// Profile management is handled in /auth/me and /auth/change-password

// Child management routes
router.get('/children', authenticate, UserController.getChildren);
router.post('/children', authenticate, UserController.createChild);
router.get('/children/:id', authenticate, UserController.getChildById);
router.put('/children/:id', authenticate, UserController.updateChild);
router.delete('/children/:id', authenticate, UserController.deleteChild);
router.get('/children/:id/progress', authenticate, UserController.getChildProgress);

// Admin-only routes for managing all students
router.get('/students', authenticate, requireParent, (req: any, res: any) => {
  res.json({ 
    success: true,
    message: 'Get all students endpoint - to be implemented for admin users',
    data: []
  });
});

export default router;
