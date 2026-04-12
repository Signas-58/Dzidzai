import { Request, Response } from 'express';
import { AnalyticsService, AnalyticsGranularity } from './service';

function parseGranularity(v: unknown): AnalyticsGranularity | undefined {
  if (v === 'daily' || v === 'weekly') return v;
  return undefined;
}

export class AnalyticsController {
  static async overview(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const childId = typeof req.query.childId === 'string' ? req.query.childId : undefined;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;

    const data = await AnalyticsService.getOverview({
      userId: req.user.id,
      childId,
      subject,
    });

    res.status(200).json({ success: true, data });
  }

  static async progress(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const childId = typeof req.query.childId === 'string' ? req.query.childId : undefined;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const granularity = parseGranularity(req.query.granularity);
    const days = typeof req.query.days === 'string' ? Number(req.query.days) : undefined;

    const data = await AnalyticsService.getProgress({
      userId: req.user.id,
      childId,
      subject,
      granularity,
      days,
    });

    res.status(200).json({ success: true, data });
  }

  static async recommendations(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const childId = typeof req.query.childId === 'string' ? req.query.childId : undefined;
    const subject = typeof req.query.subject === 'string' ? req.query.subject : undefined;
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

    const data = await AnalyticsService.getRecommendations({
      userId: req.user.id,
      childId,
      subject,
      limit,
    });

    res.status(200).json({ success: true, data });
  }
}
