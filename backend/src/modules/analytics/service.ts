import { prisma } from '../../config/prisma';

function toDateOnlyKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfIsoWeek(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // 1..7 (Mon..Sun)
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}

export type AnalyticsGranularity = 'daily' | 'weekly';

export class AnalyticsService {
  static async getOverview(input: { userId: string; childId?: string; subject?: string }) {
    const where = {
      userId: input.userId,
      ...(input.childId ? { childId: input.childId } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
    };

    const [totalSessions, avgAgg, subjectGroups] = await Promise.all([
      prisma.learningActivity.count({ where }),
      prisma.learningActivity.aggregate({ where, _avg: { confidenceScore: true } }),
      prisma.learningActivity.groupBy({
        by: ['subject'],
        where,
        _count: { _all: true },
      }),
    ]);

    const sortedSubjects = [...subjectGroups].sort((a, b) => (b._count?._all || 0) - (a._count?._all || 0));
    const mostStudiedSubject = sortedSubjects[0]?.subject || null;
    const averageConfidenceScore = avgAgg._avg.confidenceScore ?? null;

    return {
      totalSessions,
      mostStudiedSubject,
      averageConfidenceScore,
      subjectDistribution: sortedSubjects.map((g) => ({ subject: g.subject, count: g._count?._all || 0 })),
    };
  }

  static async getProgress(input: {
    userId: string;
    childId?: string;
    subject?: string;
    granularity?: AnalyticsGranularity;
    days?: number;
  }) {
    const where = {
      userId: input.userId,
      ...(input.childId ? { childId: input.childId } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
    };

    const days = input.days && input.days > 0 ? Math.min(input.days, 365) : 30;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const rows = await prisma.learningActivity.findMany({
      where: {
        ...where,
        createdAt: { gte: start },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const granularity: AnalyticsGranularity = input.granularity || 'daily';

    const buckets = new Map<string, number>();
    for (const r of rows) {
      const key =
        granularity === 'weekly'
          ? toDateOnlyKey(startOfIsoWeek(r.createdAt))
          : toDateOnlyKey(r.createdAt);
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    const series = Array.from(buckets.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return { granularity, days, series };
  }

  static async getRecommendations(input: {
    userId: string;
    childId?: string;
    subject?: string;
    limit?: number;
  }) {
    const where = {
      userId: input.userId,
      ...(input.childId ? { childId: input.childId } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
    };

    const recent = await prisma.learningActivity.findMany({
      where,
      select: { subject: true, topic: true, confidenceScore: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const byTopic = new Map<string, { subject: string; topic: string; attempts: number; low: number; avg: number }>();

    for (const r of recent) {
      const key = `${r.subject}::${r.topic}`;
      const existing = byTopic.get(key) || {
        subject: r.subject,
        topic: r.topic,
        attempts: 0,
        low: 0,
        avg: 0,
      };

      existing.attempts += 1;
      existing.low += r.confidenceScore < 0.7 ? 1 : 0;
      existing.avg += r.confidenceScore;
      byTopic.set(key, existing);
    }

    const scored = Array.from(byTopic.values())
      .map((t) => {
        const avg = t.attempts ? t.avg / t.attempts : 0;
        const score = t.low * 2 + Math.max(0, t.attempts - 2) * 0.5 + (avg < 0.75 ? 1 : 0);
        return { ...t, avg, score };
      })
      .filter((t) => t.score > 0)
      .sort((a, b) => b.score - a.score);

    const limit = input.limit && input.limit > 0 ? Math.min(input.limit, 10) : 5;

    const recommendations = scored.slice(0, limit).map((t) => {
      const prefix = t.subject === 'Math' ? 'Revise' : 'Practice';
      return {
        subject: t.subject,
        topic: t.topic,
        reason: t.low > 0 ? 'low_confidence' : 'repeated_topic',
        message: `${prefix} ${t.topic}`,
        attempts: t.attempts,
        averageConfidenceScore: t.avg,
      };
    });

    return { recommendations };
  }

  static async getChildrenSummary(input: { userId: string }) {
    const children = await prisma.child.findMany({
      where: { parentId: input.userId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!children.length) {
      return { children: [] as Array<{ id: string; name: string; lessonsTaken: number; studyTimeSeconds: number; subjects: { subject: string; count: number }[] }> };
    }

    const childIds = children.map((c) => c.id);

    const [lessonCountsByChild, subjectsByChild, timeSpentByChild] = await Promise.all([
      prisma.learningActivity.groupBy({
        by: ['childId'],
        where: { childId: { in: childIds } },
        _count: { _all: true },
      }),
      prisma.learningActivity.groupBy({
        by: ['childId', 'subject'],
        where: { childId: { in: childIds } },
        _count: { _all: true },
      }),
      prisma.userProgress.groupBy({
        by: ['userId'],
        where: { userId: { in: childIds } },
        _sum: { timeSpent: true },
      }),
    ]);

    const lessonsTakenMap = new Map<string, number>();
    for (const r of lessonCountsByChild) {
      if (!r.childId) continue;
      lessonsTakenMap.set(r.childId, r._count?._all || 0);
    }

    const subjectsMap = new Map<string, { subject: string; count: number }[]>();
    for (const r of subjectsByChild) {
      if (!r.childId) continue;
      const arr = subjectsMap.get(r.childId) || [];
      arr.push({ subject: r.subject, count: r._count?._all || 0 });
      subjectsMap.set(r.childId, arr);
    }

    const timeSpentMap = new Map<string, number>();
    for (const r of timeSpentByChild) {
      timeSpentMap.set(r.userId, r._sum?.timeSpent || 0);
    }

    const summaries = children.map((c) => {
      const subjects = (subjectsMap.get(c.id) || []).sort((a, b) => b.count - a.count);
      return {
        id: c.id,
        name: c.name,
        lessonsTaken: lessonsTakenMap.get(c.id) || 0,
        studyTimeSeconds: timeSpentMap.get(c.id) || 0,
        subjects,
      };
    });

    return { children: summaries };
  }
}
