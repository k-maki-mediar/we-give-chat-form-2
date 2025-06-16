-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_changedBy_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "changedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
