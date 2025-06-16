/*
  Warnings:

  - The `status` column on the `Beneficiary` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BeneficiaryStatus" AS ENUM ('REGISTRATION', 'AVAILABLE', 'INACTIVE', 'COMPLETED', 'CANCELED');

-- AlterTable
ALTER TABLE "Beneficiary" DROP COLUMN "status",
ADD COLUMN     "status" "BeneficiaryStatus" NOT NULL DEFAULT 'REGISTRATION';
