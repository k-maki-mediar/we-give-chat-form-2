/*
  Warnings:

  - You are about to drop the column `beneficiaryId` on the `BankAccount` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BankAccount" DROP CONSTRAINT "BankAccount_beneficiaryId_fkey";

-- AlterTable
ALTER TABLE "BankAccount" DROP COLUMN "beneficiaryId";

-- CreateTable
CREATE TABLE "BankAccountBeneficiary" (
    "bankAccountId" INTEGER NOT NULL,
    "beneficiaryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,

    CONSTRAINT "BankAccountBeneficiary_pkey" PRIMARY KEY ("bankAccountId","beneficiaryId")
);

-- AddForeignKey
ALTER TABLE "BankAccountBeneficiary" ADD CONSTRAINT "BankAccountBeneficiary_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccountBeneficiary" ADD CONSTRAINT "BankAccountBeneficiary_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
