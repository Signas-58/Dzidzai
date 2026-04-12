import { Router, Request, Response } from 'express';
import { AIController } from './controller';

const router = Router();

router.post('/generate', AIController.generate);

router.post('/generate-lesson', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/generate-exercise', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/validate-content', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/translate-content', (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/supported-languages', (req: Request, res: Response) => {
  res.status(200).json({ supported: ['Shona', 'Ndebele', 'Tonga'] });
});

export default router;
