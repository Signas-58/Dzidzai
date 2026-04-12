import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { AnalyticsController } from './controller';

const router = Router();

router.get('/overview', authenticate, AnalyticsController.overview);
router.get('/progress', authenticate, AnalyticsController.progress);
router.get('/recommendations', authenticate, AnalyticsController.recommendations);

export default router;
