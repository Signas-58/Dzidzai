import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AIController } from './controller';
import { RagController } from './rag/controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

const upload = multer({ dest: 'uploads/' });

router.post('/generate', authenticate, AIController.generate);

router.post('/rag/ingest', upload.single('file'), RagController.ingest);

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
