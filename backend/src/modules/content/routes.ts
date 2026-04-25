import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { prisma } from '../../config/prisma';

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

router.post('/progress', authenticate, async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  const { lessonId, timeSpent, completed, score, childId } = req.body as {
    lessonId?: unknown;
    timeSpent?: unknown;
    completed?: unknown;
    score?: unknown;
    childId?: unknown;
  };

  if (!lessonId || typeof lessonId !== 'string' || lessonId.trim().length < 2) {
    res.status(400).json({ success: false, error: 'lessonId is required' });
    return;
  }

  const seconds = typeof timeSpent === 'number' ? timeSpent : Number(timeSpent);
  if (!Number.isFinite(seconds) || seconds < 0) {
    res.status(400).json({ success: false, error: 'timeSpent must be a non-negative number (seconds)' });
    return;
  }

  const completedBool = Boolean(completed);
  const scoreNum = score === undefined || score === null ? null : Number(score);
  if (scoreNum !== null && (!Number.isFinite(scoreNum) || scoreNum < 0)) {
    res.status(400).json({ success: false, error: 'score must be a non-negative number' });
    return;
  }

  let resolvedChildId: string | null = null;
  const childFromAccount = await prisma.child.findFirst({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (childFromAccount) {
    resolvedChildId = childFromAccount.id;
  } else if (typeof childId === 'string' && childId.trim()) {
    const owned = await prisma.child.findFirst({
      where: { id: childId.trim(), parentId: req.user.id },
      select: { id: true },
    });
    if (owned) resolvedChildId = owned.id;
  }

  if (!resolvedChildId) {
    res.status(403).json({ success: false, error: 'Unable to resolve child for progress update' });
    return;
  }

  const existing = await prisma.userProgress.findFirst({
    where: { userId: resolvedChildId, lessonId: lessonId.trim() },
    select: { id: true, timeSpent: true },
  });

  const data = existing
    ? await prisma.userProgress.update({
        where: { id: existing.id },
        data: {
          timeSpent: Math.max(0, (existing.timeSpent || 0) + Math.round(seconds)),
          ...(scoreNum !== null ? { score: Math.round(scoreNum) } : {}),
          ...(completedBool ? { completed: true, completedAt: new Date() } : {}),
        },
      })
    : await prisma.userProgress.create({
        data: {
          userId: resolvedChildId,
          lessonId: lessonId.trim(),
          timeSpent: Math.round(seconds),
          completed: completedBool,
          ...(scoreNum !== null ? { score: Math.round(scoreNum) } : {}),
          ...(completedBool ? { completedAt: new Date() } : {}),
        },
      });

  res.status(200).json({ success: true, data });
});

router.get('/curriculum', (req: Request, res: Response) => {
  res.json({ message: 'Get curriculum endpoint - to be implemented' });
});

router.get('/offline-sync', (req: Request, res: Response) => {
  res.json({ message: 'Offline sync endpoint - to be implemented' });
});

export default router;
