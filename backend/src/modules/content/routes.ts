import { Router, Request, Response } from 'express';

const router = Router();

// Placeholder routes - will be implemented in Phase 4
router.get('/lessons', (req: Request, res: Response) => {
  res.json({ message: 'Get lessons endpoint - to be implemented' });
});

router.get('/lessons/:id', (req: Request, res: Response) => {
  res.json({ message: 'Get lesson by ID endpoint - to be implemented' });
});

router.get('/exercises', (req: Request, res: Response) => {
  res.json({ message: 'Get exercises endpoint - to be implemented' });
});

router.get('/exercises/:id', (req: Request, res: Response) => {
  res.json({ message: 'Get exercise by ID endpoint - to be implemented' });
});

router.post('/progress', (req: Request, res: Response) => {
  res.json({ message: 'Update progress endpoint - to be implemented' });
});

router.get('/curriculum', (req: Request, res: Response) => {
  res.json({ message: 'Get curriculum endpoint - to be implemented' });
});

router.get('/offline-sync', (req: Request, res: Response) => {
  res.json({ message: 'Offline sync endpoint - to be implemented' });
});

export default router;
