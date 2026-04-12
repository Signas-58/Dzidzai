/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `learning_activities` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "learning_activities" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "learning_activities_idempotencyKey_key" ON "learning_activities"("idempotencyKey");
