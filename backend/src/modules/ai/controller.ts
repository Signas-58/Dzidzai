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

          let resolvedChildId: string | null = childId && typeof childId === 'string' ? childId : null;
          if (!resolvedChildId) {
            const child = await prisma.child.findFirst({
              where: { userId: req.user.id },
              select: { id: true },
            });
            resolvedChildId = child?.id || null;
          }

          await prisma.learningActivity.create({
            data: {
              userId: req.user.id,
              childId: resolvedChildId,
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

  static async syncActivities(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const body = req.body as unknown;
      const activities = (body && typeof body === 'object' && (body as any).activities) as unknown;
      if (!Array.isArray(activities) || activities.length === 0) {
        res.status(400).json({ success: false, error: 'activities must be a non-empty array' });
        return;
      }

      let resolvedChildId: string | null = null;
      {
        const child = await prisma.child.findFirst({
          where: { userId: req.user.id },
          select: { id: true },
        });
        resolvedChildId = child?.id || null;
      }

      let inserted = 0;
      let deduped = 0;

      for (const a of activities) {
        const subject = (a as any)?.subject;
        const topic = (a as any)?.topic;
        const gradeLevel = (a as any)?.gradeLevel;
        const language = (a as any)?.language;
        const confidenceScore = (a as any)?.confidenceScore;
        const idempotencyKey = (a as any)?.idempotencyKey;

        if (
          typeof subject !== 'string' ||
          typeof topic !== 'string' ||
          typeof gradeLevel !== 'string' ||
          typeof language !== 'string' ||
          typeof confidenceScore !== 'number' ||
          typeof idempotencyKey !== 'string' ||
          !idempotencyKey.trim()
        ) {
          continue;
        }

        try {
          await prisma.learningActivity.create({
            data: {
              userId: req.user.id,
              childId: resolvedChildId,
              idempotencyKey: idempotencyKey.trim(),
              subject: subject.trim(),
              topic: topic.trim(),
              gradeLevel: gradeLevel.trim(),
              language: language.trim(),
              confidenceScore,
            },
          });
          inserted += 1;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          const isUnique = msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('constraint');
          if (isUnique) {
            deduped += 1;
            continue;
          }
          logger.warn('Failed to sync LearningActivity row', e);
        }
      }

      res.status(200).json({ success: true, data: { inserted, deduped, received: activities.length } });
    } catch (err) {
      logger.error('AI syncActivities error', err);
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Sync failed' });
    }
  }
}
