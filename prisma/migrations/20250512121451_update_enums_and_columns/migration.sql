/*
  Warnings:

  - You are about to drop the column `usagePhase` on the `DonationDetail` table. All the data in the column will be lost.
  - The `status` column on the `DonationRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Transfer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'ALLOCATED', 'TRANSFERRED', 'CANCELED', 'REFUND', 'FAILED_INCOME', 'FAILED_OUTCOME');

-- AlterTable
ALTER TABLE "DonationDetail" DROP COLUMN "usagePhase";

-- AlterTable
ALTER TABLE "DonationRequest" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "isBeneficiaryFundingOpen" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
