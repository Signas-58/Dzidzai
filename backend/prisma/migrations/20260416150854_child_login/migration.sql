-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_children" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'SHONA',
    "preferredSubjects" TEXT,
    "parentId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "children_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_children" ("createdAt", "gradeLevel", "id", "name", "parentId", "preferredLanguage", "updatedAt") SELECT "createdAt", "gradeLevel", "id", "name", "parentId", "preferredLanguage", "updatedAt" FROM "children";
DROP TABLE "children";
ALTER TABLE "new_children" RENAME TO "children";
CREATE UNIQUE INDEX "children_userId_key" ON "children"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
