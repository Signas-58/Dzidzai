import { Request, Response } from 'express';
import { AIService } from './aiService';
import { AIGenerateRequest, Subject, SupportedLanguage, GradeLevel } from './types';
import { AIValidationError } from './validators';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/prisma';

function isSubject(v: unknown): v is Subject {
  return v === 'Math' || v === 'English' || v === 'Science' || v === 'Social Studies';
}

function isLanguage(v: unknown): v is SupportedLanguage {
  return v === 'Shona' || v === 'Ndebele' || v === 'Tonga' || v === 'English';
}

function isGradeLevel(v: unknown): v is GradeLevel {
  return (
    v === 'ECD A' ||
    v === 'ECD B' ||
    v === 'Grade 1' ||
    v === 'Grade 2' ||
    v === 'Grade 3' ||
    v === 'Grade 4' ||
    v === 'Grade 5' ||
    v === 'Grade 6' ||
    v === 'Grade 7'
  );
}

export class AIController {
  static async generate(req: Request, res: Response): Promise<void> {
    try {
      const { subject, topic, gradeLevel, language, childId, improve, mode, translateTo } = req.body as Partial<AIGenerateRequest>;

      if (!isSubject(subject)) {
        res.status(400).json({ success: false, error: 'Invalid subject' });
        return;
      }

      if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
        res.status(400).json({ success: false, error: 'Invalid topic' });
        return;
      }

      if (!isGradeLevel(gradeLevel)) {
        res.status(400).json({ success: false, error: 'Invalid gradeLevel' });
        return;
      }

      if (!isLanguage(language)) {
        res.status(400).json({ success: false, error: 'Invalid language' });
        return;
      }

      const result = await AIService.generateStructuredContent({
        subject,
        topic: topic.trim(),
        gradeLevel,
        language,
        improve: Boolean(improve),
        mode: mode === 'simplify' || mode === 'translate' ? mode : 'normal',
        translateTo: translateTo && isLanguage(translateTo) ? translateTo : undefined,
      });

      if (req.user?.id) {
        try {
          const idempotencyKeyHeader = req.header('Idempotency-Key');
          const idempotencyKey = idempotencyKeyHeader && idempotencyKeyHeader.trim() ? idempotencyKeyHeader.trim() : null;

          await prisma.learningActivity.create({
            data: {
              userId: req.user.id,
              childId: childId && typeof childId === 'string' ? childId : null,
              idempotencyKey,
              subject,
              topic: topic.trim(),
              gradeLevel,
              language: result.language,
              confidenceScore: result.confidenceScore,
            },
          });
        } catch (logErr) {
          const msg = logErr instanceof Error ? logErr.message : String(logErr);
          const isUnique = msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('constraint');
          if (isUnique) {
            logger.info('LearningActivity deduplicated by idempotencyKey');
          } else {
            logger.warn('Failed to persist LearningActivity', logErr);
          }
        }
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      logger.error('AI generate error', err);

      if (err instanceof Error && err.message.includes('GROQ_API_KEY')) {
        res.status(503).json({ success: false, error: 'AI provider not configured' });
        return;
      }

      if (err instanceof AIValidationError) {
        res.status(422).json({ success: false, error: err.message });
        return;
      }

      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'AI generation failed',
      });
    }
  }
}
