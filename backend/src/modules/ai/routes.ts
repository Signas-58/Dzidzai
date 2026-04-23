import { Router, Request, Response } from 'express';
import fs from 'fs';
import dotenv from 'dotenv';
import multer from 'multer';
import { AIController } from './controller';
import { RagController } from './rag/controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

const upload = multer({ dest: 'uploads/' });

router.get('/status', (req: Request, res: Response) => {
  const cwd = process.cwd();
  const envPath = `${cwd}/.env`;
  const envFileExists = fs.existsSync(envPath);
  let envFile: {
    aiUseMockRaw: string | null;
    groqKeyPresent: boolean;
    groqKeyLength: number;
  } | null = null;

  if (envFileExists) {
    try {
      const raw = fs.readFileSync(envPath, 'utf8');
      const parsed = dotenv.parse(raw);
      const groqKey = parsed.GROQ_API_KEY ?? '';
      envFile = {
        aiUseMockRaw: parsed.AI_USE_MOCK ?? null,
        groqKeyPresent: Boolean(groqKey && groqKey.trim().length > 0),
        groqKeyLength: groqKey ? groqKey.length : 0,
      };
    } catch {
      envFile = null;
    }
  }
  res.status(200).json({
    cwd,
    envFileExists,
    envFile,
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    aiUseMockRaw: process.env.AI_USE_MOCK ?? null,
    useMock: String(process.env.AI_USE_MOCK || '').toLowerCase() === 'true',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  });
});

router.post('/generate', authenticate, AIController.generate);

router.post('/sync-activities', authenticate, AIController.syncActivities);

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
