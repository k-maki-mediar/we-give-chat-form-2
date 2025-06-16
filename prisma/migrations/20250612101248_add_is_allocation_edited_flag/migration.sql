/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `OrganizationMember` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Donor_userId_key";

-- AlterTable
ALTER TABLE "OrganizationMember" DROP COLUMN "avatarUrl";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "TempTokenStore" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" INTEGER,
    "purpose" TEXT NOT NULL DEFAULT 'auth',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TempTokenStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TempTokenStore_token_key" ON "TempTokenStore"("token");

-- CreateIndex
CREATE INDEX "TempTokenStore_token_idx" ON "TempTokenStore"("token");

-- CreateIndex
CREATE INDEX "TempTokenStore_email_idx" ON "TempTokenStore"("email");

-- CreateIndex
CREATE INDEX "TempTokenStore_expiresAt_idx" ON "TempTokenStore"("expiresAt");

-- AddForeignKey
ALTER TABLE "TempTokenStore" ADD CONSTRAINT "TempTokenStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
