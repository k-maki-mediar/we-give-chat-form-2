-- AlterTable
ALTER TABLE "BeneficiaryPersonDetails" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "BeneficiaryProjectDetails" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Donor" ADD COLUMN     "altMailAddress" TEXT,
ADD COLUMN     "altMailZipcode" TEXT,
ADD COLUMN     "contactPersonName" TEXT,
ADD COLUMN     "contactPersonTitle" TEXT,
ADD COLUMN     "hasAltMailAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNamePublished" BOOLEAN NOT NULL DEFAULT false;