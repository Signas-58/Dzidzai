-- CreateTable
CREATE TABLE "learning_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "childId" TEXT,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "learning_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_activities_childId_fkey" FOREIGN KEY ("childId") REFERENCES "children" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "learning_activities_userId_createdAt_idx" ON "learning_activities"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "learning_activities_childId_createdAt_idx" ON "learning_activities"("childId", "createdAt");
