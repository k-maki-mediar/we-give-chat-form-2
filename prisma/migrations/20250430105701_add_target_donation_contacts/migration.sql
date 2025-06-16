-- AlterTable
ALTER TABLE "BeneficiaryPersonDetails" ADD COLUMN     "contactEmail" VARCHAR(255),
ADD COLUMN     "contactPhone" VARCHAR(20),
ADD COLUMN     "targetDonationAmount" DECIMAL(65,30) DEFAULT 0.0;

-- AlterTable
ALTER TABLE "BeneficiaryProjectDetails" ADD COLUMN     "contactEmail" VARCHAR(255),
ADD COLUMN     "contactPhone" VARCHAR(20),
ADD COLUMN     "targetDonationAmount" DECIMAL(65,30) DEFAULT 0.0;
