import { Router } from 'express';
import { AuthController } from './controllers';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getProfile);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;
