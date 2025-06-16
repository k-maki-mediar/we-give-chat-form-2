-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('GUEST', 'MEMBER');

-- AlterTable
ALTER TABLE "DonationRequest" ADD COLUMN     "membershipType" "MembershipType" NOT NULL DEFAULT 'GUEST';
