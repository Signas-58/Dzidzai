import { Request, Response } from 'express';
import path from 'path';
import { RagIngestionService } from './ingest';
import { Subject } from '../types';
import { logger } from '../../../utils/logger';

function isSubject(v: unknown): v is Subject {
  return v === 'Math' || v === 'English' || v === 'Science' || v === 'Social Studies';
}

export class RagController {
  static async ingest(req: Request, res: Response): Promise<void> {
    try {
      const subject = req.body?.subject;
      const topic = req.body?.topic;

      if (!isSubject(subject)) {
        res.status(400).json({ success: false, error: 'Invalid subject' });
        return;
      }

      const file = (req as any).file as { path?: string; originalname?: string } | undefined;
      if (!file?.path) {
        res.status(400).json({ success: false, error: 'File is required' });
        return;
      }

      const result = await RagIngestionService.ingestFile({
        filePath: file.path,
        subject,
        topic: typeof topic === 'string' && topic.trim() ? topic.trim() : undefined,
        source: 'upload',
        filename: file.originalname || path.basename(file.path),
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      logger.error('RAG ingest error', err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Ingestion failed' });
    }
  }
}
